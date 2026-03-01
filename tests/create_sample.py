import zipfile
import os

# We will create a bare minimum docx file using zipfile that has one single comment in it.
# To keep this proof of concept completely self-contained without needing an external docx,
# we will just create a tiny mock XML structure for our framework's `parser.py` to ingest.
# Our `parser.py` just unzips and looks for `word/comments.xml`

mock_comments_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:comment w:id="1" w:author="Reviewer 1" w:date="2024-01-01T12:00:00Z" w:initials="R1">
    <w:p>
      <w:r>
        <w:t>Please add a citation here regarding researcher skepticism.</w:t>
      </w:r>
    </w:p>
  </w:comment>
  <w:comment w:id="2" w:author="Reviewer 2" w:date="2024-01-02T12:00:00Z" w:initials="R2">
    <w:p>
      <w:r>
        <w:t>Change to something more formal and academic.</w:t>
      </w:r>
    </w:p>
  </w:comment>
</w:comments>
"""

mock_document_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:commentRangeStart w:id="1"/>
      <w:r><w:t>However, many researchers are skeptical.</w:t></w:r>
      <w:commentRangeEnd w:id="1"/>
    </w:p>
    <w:p>
      <w:commentRangeStart w:id="2"/>
      <w:r><w:t>It was very good.</w:t></w:r>
      <w:commentRangeEnd w:id="2"/>
    </w:p>
  </w:body>
</w:document>
"""

os.makedirs("tests", exist_ok=True)
with zipfile.ZipFile("tests/sample_paper.docx", "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("word/comments.xml", mock_comments_xml)
    zf.writestr("word/document.xml", mock_document_xml)

print("Created tests/sample_paper.docx with injected XML comments.")
