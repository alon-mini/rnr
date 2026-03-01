import os
import glob
import re
import subprocess
import defusedxml.minidom

def assemble_docx(original_file, data_dir="data", unpack_dir="unpacked", output_file="output.docx"):
    if not os.path.exists(original_file):
        print(f"Original file {original_file} not found.")
        return
        
    if not os.path.exists(unpack_dir):
        print(f"Unpacked directory {unpack_dir} not found. Did you run parser.py?")
        return
        
    resolved_files = glob.glob(os.path.join(data_dir, "*_RESOLVED.md"))
    
    if not resolved_files:
        print("No resolved comments found. Did the Orchestrator run?")
        return
        
    # The Anthropic DOCX skill modifies the raw document and comment XMLs
    document_xml_path = os.path.join(unpack_dir, "word", "document.xml")
    
    import json
    map_path = os.path.join(data_dir, "document_map.json")
    document_map = []
    if os.path.exists(map_path):
        with open(map_path, "r", encoding="utf-8") as map_f:
            document_map = json.load(map_f)

    with open(document_xml_path, "r", encoding="utf-8") as f:
        document_content = f.read()
        
    comment_script = os.path.join(os.path.dirname(__file__), "anthropic_docx_scripts", "comment.py")
        
    for fpath in resolved_files:
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
            
        revised_text_match = re.search(r"<revised_text>(.*?)</revised_text>", content, re.DOTALL)
        reply_match = re.search(r"<reviewer_reply>(.*?)</reviewer_reply>", content, re.DOTALL)
        
        revised_text = revised_text_match.group(1).strip() if revised_text_match else "[Parse Error]"
        reply = reply_match.group(1).strip() if reply_match else "[Parse Error]"
        
        comment_id = os.path.basename(fpath).replace("COMMENT_", "").replace("_RESOLVED.md", "")
        comment_info = next((c for c in document_map if c["id"] == comment_id), None)
        
        if comment_info and comment_info.get("type") == "edit_suggestion":
            original_id = comment_id.replace("EDIT_", "")
            base_comment_id = "88" + original_id
            
            print(f"Transforming Edit Suggestion {comment_id} into comment...")
            subprocess.run([
                "python", comment_script, unpack_dir, base_comment_id, 
                comment_info.get("comment_text", "Edit Suggestion"),
                "--author", comment_info.get("author", "Reviewer")
            ], check=True)
            
            reply_id = "99" + original_id
            print(f"Adding subagent reply to Edit Suggestion {comment_id}...")
            subprocess.run([
                "python", comment_script, unpack_dir, reply_id, reply,
                "--author", "Revise & Resubmit Framework",
                "--parent", base_comment_id
            ], check=True)
            
            tag = comment_info.get("tag", "w:ins")
            pattern = re.compile(rf'(<{tag}[^>]*w:id="{original_id}"[^>]*>)(.*?)(</{tag}>)', re.DOTALL)
            
            def replace_edit(match):
                inner = match.group(2)
                if tag == "w:del":
                    inner = inner.replace("<w:delText", "<w:t").replace("</w:delText>", "</w:t>")
                return f'<w:commentRangeStart w:id="{base_comment_id}"/>{inner}<w:commentRangeEnd w:id="{base_comment_id}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="{base_comment_id}"/></w:r><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="{reply_id}"/></w:r>'
                
            document_content = pattern.sub(replace_edit, document_content)

        else:
            print(f"Adding subagent reply to Comment {comment_id}...")
            reply_id = "99" + comment_id
            subprocess.run([
                "python", comment_script, unpack_dir, reply_id, reply,
                "--author", "Revise & Resubmit Framework",
                "--parent", comment_id
            ], check=True)
            
            parent_ref_pattern = re.compile(rf'(<w:commentReference[^>]*w:id="{comment_id}"[^>]*/>.*?</w:r>)')
            reply_ref = f'<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="{reply_id}"/></w:r>'
            
            if parent_ref_pattern.search(document_content):
                document_content = parent_ref_pattern.sub(r'\g<1>' + reply_ref, document_content, count=1)

    # Save modified document_content before packing
    with open(document_xml_path, "w", encoding="utf-8") as f:
        f.write(document_content)
        
    pack_script = os.path.join(os.path.dirname(__file__), "anthropic_docx_scripts", "office", "pack.py")
    
    # 3. Pack it back up into the revised DOCX
    print(f"Packing into final document {output_file}...")
    subprocess.run(["python", pack_script, unpack_dir, output_file, "--original", original_file], check=True)
    
    print(f"Successfully assembled revised document at {output_file}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("original", help="Path to original docx")
    parser.add_argument("output", help="Path to save output docx")
    args = parser.parse_args()
    
    assemble_docx(args.original, "data", "unpacked", args.output)
