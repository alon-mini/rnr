import os
import glob
import re
import shutil
import subprocess
import defusedxml.minidom
from xml.sax.saxutils import escape as xml_escape

def _escape_for_xml(text: str) -> str:
    return xml_escape(text, entities={"'": "&apos;", '"': "&quot;"})

def assemble_docx(original_file, data_dir="data", unpack_dir="unpacked", output_file="output.docx", fresh=False):
    if not os.path.exists(original_file):
        print(f"Original file {original_file} not found.")
        return
        
    if fresh:
        if os.path.exists(unpack_dir):
            shutil.rmtree(unpack_dir)
        unpack_script = os.path.join(os.path.dirname(__file__), "anthropic_docx_scripts", "office", "unpack.py")
        print(f"Fresh assembly requested. Unpacking {original_file} to {unpack_dir}/ ...")
        subprocess.run(["python", unpack_script, original_file, unpack_dir, "--merge-runs", "true"], check=True)
        
    if not os.path.exists(unpack_dir):
        print(f"Unpacked directory {unpack_dir} not found. Did you run parser.py?")
        return
        
    resolved_dir = os.path.join(data_dir, "resolved")
    resolved_files = glob.glob(os.path.join(resolved_dir, "*_RESOLVED.md"))
    
    if not resolved_files:
        print(f"No resolved comments found in {resolved_dir}. Did the Orchestrator run?")
        return
        
    # The Anthropic DOCX skill modifies the raw document and comment XMLs
    document_xml_path = os.path.join(unpack_dir, "word", "document.xml")
    comments_xml_path = os.path.join(unpack_dir, "word", "comments.xml")
    
    # Load existing comment IDs to prevent duplicates
    existing_comment_ids = set()
    if os.path.exists(comments_xml_path):
        with open(comments_xml_path, "r", encoding="utf-8") as f:
            try:
                comments_dom = defusedxml.minidom.parseString(f.read())
                for comment in comments_dom.getElementsByTagName("w:comment"):
                    cid = comment.getAttribute("w:id")
                    if cid:
                        existing_comment_ids.add(cid)
            except Exception as e:
                print(f"Warning: Could not parse existing comments.xml: {e}")
        
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
        reply = _escape_for_xml(reply_match.group(1).strip()) if reply_match else "[Parse Error]"
        
        comment_id = os.path.basename(fpath).replace("COMMENT_", "").replace("_RESOLVED.md", "")
        comment_info = next((c for c in document_map if c["id"] == comment_id), None)
        
        if comment_info and comment_info.get("type") == "edit_suggestion":
            original_id = comment_id.replace("EDIT_", "")
            
            clean_id = re.sub(r'\D', '', original_id)
            base_comment_id = "88" + clean_id
            
            if base_comment_id not in existing_comment_ids:
                print(f"Transforming Edit Suggestion {comment_id} into comment...")
                try:
                    subprocess.run([
                        "python", comment_script, unpack_dir, base_comment_id, 
                        comment_info.get("comment_text", "Edit Suggestion"),
                        "--author", comment_info.get("author", "Reviewer")
                    ], check=True, capture_output=True, text=True)
                    existing_comment_ids.add(base_comment_id)
                except subprocess.CalledProcessError as e:
                    print(f"Edit Suggestion Base Comment Error: {e.stderr}")
                    raise
            else:
                print(f"Base comment {base_comment_id} already exists. Skipping insertion.")
            
            reply_id = "99" + clean_id
            if reply_id not in existing_comment_ids:
                try:
                    subprocess.run([
                        "python", comment_script, unpack_dir, reply_id, reply,
                        "--author", "Revise & Resubmit Framework",
                        "--parent", base_comment_id
                    ], check=True, capture_output=True, text=True)
                    existing_comment_ids.add(reply_id)
                except subprocess.CalledProcessError as e:
                    # If this fails because parent isn't found (e.g. dummy test state), we can simply add it without a parent as fallback
                    if "not found" in e.stderr:
                        print(f"Parent {base_comment_id} not found, adding reply standalone")
                        subprocess.run([
                            "python", comment_script, unpack_dir, reply_id, reply,
                            "--author", "Revise & Resubmit Framework"
                        ], check=True, capture_output=True, text=True)
                        existing_comment_ids.add(reply_id)
                    else:
                        print(f"Edit Suggestion Reply Error: {e.stderr}")
                        raise
            else:
                print(f"Reply comment {reply_id} already exists. Skipping insertion.")
            
            dom_id = original_id.split("_")[0] if "_" in original_id else original_id
            tag = comment_info.get("tag", "w:ins")

            # Use DOM parsing instead of regex to handle self-closing tags correctly
            dom = defusedxml.minidom.parseString(document_content)

            # Find the target element (w:ins or w:del) by w:id attribute
            target_element = None
            elements = dom.getElementsByTagName(tag)
            for elem in elements:
                if elem.getAttribute('w:id') == dom_id:
                    target_element = elem
                    break

            if target_element is not None:
                # Find all <w:t> elements within the target element
                t_elements = target_element.getElementsByTagName('w:t')

                if t_elements.length > 0:
                    # Replace text in the first <w:t> element
                    first_t = t_elements[0]
                    first_t.setAttribute('xml:space', 'preserve')
                    # Clear existing text nodes and add new text
                    while first_t.firstChild:
                        first_t.removeChild(first_t.firstChild)
                    first_t.appendChild(dom.createTextNode(_escape_for_xml(revised_text)))

                    # Empty subsequent <w:t> elements
                    for i in range(1, t_elements.length):
                        t_elem = t_elements[i]
                        while t_elem.firstChild:
                            t_elem.removeChild(t_elem.firstChild)
                else:
                    # No <w:t> element exists, create one wrapped in <w:r>
                    new_r = dom.createElement('w:r')
                    new_t = dom.createElement('w:t')
                    new_t.setAttribute('xml:space', 'preserve')
                    new_t.appendChild(dom.createTextNode(_escape_for_xml(revised_text)))
                    new_r.appendChild(new_t)
                    target_element.appendChild(new_r)

                # Get the parent of the target element to insert markers
                parent = target_element.parentNode

                # Create comment range markers and references
                comment_range_start = dom.createElement('w:commentRangeStart')
                comment_range_start.setAttribute('w:id', base_comment_id)

                comment_range_end = dom.createElement('w:commentRangeEnd')
                comment_range_end.setAttribute('w:id', base_comment_id)

                # Create comment reference for base comment
                ref_r1 = dom.createElement('w:r')
                ref_rpr1 = dom.createElement('w:rPr')
                ref_rstyle1 = dom.createElement('w:rStyle')
                ref_rstyle1.setAttribute('w:val', 'CommentReference')
                ref_rpr1.appendChild(ref_rstyle1)
                ref_r1.appendChild(ref_rpr1)
                comment_ref1 = dom.createElement('w:commentReference')
                comment_ref1.setAttribute('w:id', base_comment_id)
                ref_r1.appendChild(comment_ref1)

                # Create comment reference for reply
                ref_r2 = dom.createElement('w:r')
                ref_rpr2 = dom.createElement('w:rPr')
                ref_rstyle2 = dom.createElement('w:rStyle')
                ref_rstyle2.setAttribute('w:val', 'CommentReference')
                ref_rpr2.appendChild(ref_rstyle2)
                ref_r2.appendChild(ref_rpr2)
                comment_ref2 = dom.createElement('w:commentReference')
                comment_ref2.setAttribute('w:id', reply_id)
                ref_r2.appendChild(comment_ref2)

                # Insert commentRangeStart before the target element
                parent.insertBefore(comment_range_start, target_element)

                # Insert commentRangeEnd after the target element
                parent.insertBefore(comment_range_end, target_element.nextSibling)
            else:
                parent.appendChild(comment_range_end)

            # Insert comment references after commentRangeEnd
            # Only insert if they do not already exist in the surrounding structure.
            # (Checking document_content string representation is faster than full DOM traversal here)
            ref1_exists = f'<w:commentReference w:id="{base_comment_id}"' in document_content
            ref2_exists = f'<w:commentReference w:id="{reply_id}"' in document_content

            if not ref1_exists:
                if comment_range_end.nextSibling:
                    parent.insertBefore(ref_r1, comment_range_end.nextSibling)
                else:
                    parent.appendChild(ref_r1)
                    
            if not ref2_exists:
                if not ref1_exists:
                    parent.insertBefore(ref_r2, ref_r1.nextSibling)
                else:
                    if comment_range_end.nextSibling:
                        parent.insertBefore(ref_r2, comment_range_end.nextSibling)
                    else:
                        parent.appendChild(ref_r2)

            # Serialize back to string, removing the XML declaration if present
            xml_output = dom.toxml()
            # Remove XML declaration if it was added by toxml()
            if xml_output.startswith('<?xml'):
                xml_output = xml_output.split('?>', 1)[-1]
            document_content = xml_output

        else:
            clean_id = re.sub(r'\D', '', comment_id)
            reply_id = "99" + clean_id
            
            if reply_id not in existing_comment_ids:
                print(f"Adding subagent reply to comment {comment_id} into {reply_id}...")
                try:
                    subprocess.run([
                        "python", comment_script, unpack_dir, reply_id, reply,
                        "--author", "Revise & Resubmit Framework",
                        "--parent", comment_id
                    ], check=True, capture_output=True, text=True)
                    existing_comment_ids.add(reply_id)
                except subprocess.CalledProcessError as e:
                    if "not found" in e.stderr:
                        print(f"Parent {comment_id} not found, adding reply standalone")
                        subprocess.run([
                            "python", comment_script, unpack_dir, reply_id, reply,
                            "--author", "Revise & Resubmit Framework"
                        ], check=True, capture_output=True, text=True)
                        existing_comment_ids.add(reply_id)
                    else:
                        print(f"Comment Reply Error: {e.stderr}")
                        raise
            else:
                print(f"Reply comment {reply_id} already exists. Skipping insertion.")
            
            # For regular comments
            parent_ref_pattern = re.compile(rf'(<w:commentReference[^>]*w:id="{comment_id}"[^>]*/>.*?</w:r>)')
            reply_ref = f'<w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="{reply_id}"/></w:r>'
            
            # Check if reply_ref already exists
            if f'<w:commentReference w:id="{reply_id}"' not in document_content:
                if parent_ref_pattern.search(document_content):
                    document_content = parent_ref_pattern.sub(r'\g<1>' + reply_ref, document_content, count=1)
                
                comment_range_pattern = re.compile(rf'(<w:commentRangeStart[^>]*w:id="{comment_id}"[^>]*/>)(.*?)(<w:commentRangeEnd[^>]*w:id="{comment_id}"[^>]*/>)', re.DOTALL)
                def replace_commented_text(match):
                    inner = match.group(2)
                    t_pattern = re.compile(r'(<w:t>|<w:t\s+[^>]*>)(.*?)(</w:t>)', re.DOTALL)
                    first = [True]
                    
                    def replace_t(t_match):
                        if first[0]:
                            first[0] = False
                            # Insert revised text in the first text node, preserving its opening attributes (or enforcing xml:space="preserve")
                            if 'xml:space="preserve"' not in t_match.group(1):
                                t_start = t_match.group(1).replace('<w:t', '<w:t xml:space="preserve"')
                            else:
                                t_start = t_match.group(1)
                            return f'{t_start}{_escape_for_xml(revised_text)}{t_match.group(3)}'
                        else:
                            # Empty subsequent text nodes
                            return f'{t_match.group(1)}{t_match.group(3)}'
                    
                    new_inner = t_pattern.sub(replace_t, inner)
                    
                    # If no text node was found inside, safely append a new run immediately after the start tag
                    if first[0]:
                        new_inner = f'<w:r><w:t xml:space="preserve">{_escape_for_xml(revised_text)}</w:t></w:r>' + new_inner
                        
                    return f'{match.group(1)}{new_inner}{match.group(3)}'
                        
                document_content = comment_range_pattern.sub(replace_commented_text, document_content)

    # Save modified document_content before packing using minidom to format
    print("Validating generated XML...")
    try:
        with open("debug_document_output.xml", "w", encoding="utf-8") as df:
            df.write(document_content)
        dom = defusedxml.minidom.parseString(document_content)
        with open(document_xml_path, "wb") as f:
            f.write(dom.toxml(encoding="utf-8"))
    except Exception as e:
        print(f"Failed parsing document_content. Check debug_document_output.xml. Error: {e}")
        with open("error_document.xml", "w", encoding="utf-8") as f:
            f.write(document_content)
        raise
        
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
    parser.add_argument("--data-dir", help="Directory where data is stored", default="data")
    parser.add_argument("--unpack-dir", help="Directory where docx is unpacked", default="unpacked")
    parser.add_argument("--fresh", action="store_true", help="Delete unpack block and start from scratch")
    args = parser.parse_args()
    
    assemble_docx(args.original, data_dir=args.data_dir, unpack_dir=args.unpack_dir, output_file=args.output, fresh=args.fresh)
