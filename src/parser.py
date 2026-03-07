import os
import json
import subprocess
import shutil
import defusedxml.minidom
from pathlib import Path

def parse_docx(file_path, reviewer=None, data_dir="data", unpack_dir="unpacked"):
    extracted_dir = os.path.join(data_dir, "extracted")
    resolved_dir = os.path.join(data_dir, "resolved")
    os.makedirs(extracted_dir, exist_ok=True)
    os.makedirs(resolved_dir, exist_ok=True)
    
    # Clean previous unpacks
    if os.path.exists(unpack_dir):
        shutil.rmtree(unpack_dir)
        
    unpack_script = os.path.join(os.path.dirname(__file__), "anthropic_docx_scripts", "office", "unpack.py")
    
    # 1. Unpack the docx to raw XML using the Anthropic skill
    print(f"Unpacking {file_path} to {unpack_dir}/ ...")
    subprocess.run(["python", unpack_script, file_path, unpack_dir, "--merge-runs", "true"], check=True)
    
    comments_xml_path = os.path.join(unpack_dir, "word", "comments.xml")
    document_xml_path = os.path.join(unpack_dir, "word", "document.xml")
    
    if not os.path.exists(comments_xml_path) or not os.path.exists(document_xml_path):
        print("No comments found in this document.")
        return []
        
    # 2. Parse comments.xml
    with open(comments_xml_path, "r", encoding="utf-8") as f:
        comments_dom = defusedxml.minidom.parseString(f.read())
        
    # 3. Parse document.xml to find the text nodes wrapped by commentRangeStart/End
    with open(document_xml_path, "r", encoding="utf-8") as f:
        document_dom = defusedxml.minidom.parseString(f.read())
        
    extracted_comments = []
    
    # Helper to map a comment ID to its target text in document.xml
    def extract_target_text(cid):
        # In a robust implementation, we would iterate through all nodes between
        # <w:commentRangeStart w:id="cid"/> and <w:commentRangeEnd w:id="cid"/>
        # and extract the <w:t> tags. 
        # For simplicity in this PoC, we will grab the first paragraph that contains it.
        for p in document_dom.getElementsByTagName("w:p"):
            starts = p.getElementsByTagName("w:commentRangeStart")
            for start in starts:
                if start.getAttribute("w:id") == cid:
                    texts = [t.firstChild.nodeValue for t in p.getElementsByTagName("w:t") if t.firstChild]
                    return " ".join(texts)
        return "[Could not extract precise text block]"

    for w_comment in comments_dom.getElementsByTagName("w:comment"):
        cid = w_comment.getAttribute("w:id")
        author = w_comment.getAttribute("w:author")
        
        if reviewer and reviewer.lower() not in (author or "").lower():
            continue
            
        c_texts = [t.firstChild.nodeValue for t in w_comment.getElementsByTagName("w:t") if t.firstChild]
        comment_text = " ".join(c_texts)
        
        target_text = extract_target_text(cid)
        
        extracted_comments.append({
            "id": cid,
            "author": author,
            "comment_text": comment_text,
            "target_text": target_text,
            "type": "comment"
        })
        
        # Save to individual markdown files
        comment_path = os.path.join(extracted_dir, f"COMMENT_{cid}.md")
        with open(comment_path, "w", encoding="utf-8") as f:
            f.write(f"<!-- ID: {cid} -->\n")
            f.write(f"<!-- TYPE: comment -->\n")
            f.write(f"<reviewer_comment>\n{comment_text}\n</reviewer_comment>\n\n")
            f.write(f"<original_text>\n{target_text}\n</original_text>")
            
    # 4. Parse edit suggestions (w:ins, w:del)
    edit_id_counter = 5000  # Start high to avoid collision with comments
    
    for tag in ["w:ins", "w:del"]:
        for edit_node in document_dom.getElementsByTagName(tag):
            author = edit_node.getAttribute("w:author")
            if not author:
                continue
                
            if reviewer and reviewer.lower() not in author.lower():
                continue
                
            base_cid = edit_node.getAttribute("w:id")
            if not base_cid:
                cid = f"EDIT_{edit_id_counter}"
            else:
                cid = f"EDIT_{base_cid}_{edit_id_counter}"
            edit_id_counter += 1
                
            # Extract text from the edit node
            c_texts = [t.firstChild.nodeValue for t in edit_node.getElementsByTagName("w:t") if t.firstChild]
            edit_text = " ".join(c_texts).strip()
            
            if not edit_text and tag == "w:del":
                edit_text = "[Deleted text]"
                
            if not edit_text:
                continue
                
            # For target text, we'll try to get the surrounding paragraph
            p_node = edit_node
            while p_node and getattr(p_node, 'tagName', '') != "w:p":
                p_node = p_node.parentNode
                
            if p_node and getattr(p_node, 'tagName', '') == "w:p":
                p_texts = [t.firstChild.nodeValue for t in p_node.getElementsByTagName("w:t") if t.firstChild]
                target_text = " ".join(p_texts)
            else:
                target_text = edit_text
                
            comment_text = f"[{'Insertion' if tag == 'w:ins' else 'Deletion'} Suggestion]: {edit_text}"
            
            extracted_comments.append({
                "id": cid,
                "author": author,
                "comment_text": comment_text,
                "target_text": target_text,
                "type": "edit_suggestion",
                "tag": tag
            })
            
            # Save to individual markdown files
            comment_path = os.path.join(extracted_dir, f"COMMENT_{cid}.md")
            with open(comment_path, "w", encoding="utf-8") as f:
                f.write(f"<!-- ID: {cid} -->\n")
                f.write(f"<!-- TYPE: edit_suggestion -->\n")
                f.write(f"<reviewer_comment>\n{comment_text}\n</reviewer_comment>\n\n")
                f.write(f"<original_text>\n{target_text}\n</original_text>")
            
    with open(os.path.join(data_dir, "document_map.json"), "w") as f:
        json.dump(extracted_comments, f, indent=4)
        
    return extracted_comments

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to the docx file")
    parser.add_argument("--reviewer", help="Name of the reviewer to filter comments/suggestions by", default=None)
    parser.add_argument("--data-dir", help="Directory to store extracted data", default="data")
    parser.add_argument("--unpack-dir", help="Directory to unpack standard docx contents to", default="unpacked")
    args = parser.parse_args()
    
    if os.path.exists(args.file):
        comments = parse_docx(args.file, reviewer=args.reviewer, data_dir=args.data_dir, unpack_dir=args.unpack_dir)
        print(f"Extracted {len(comments)} comments/suggestions to {args.data_dir}/ directory.")
    else:
        print("File not found.")
