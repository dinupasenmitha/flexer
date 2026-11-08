# -*- coding: utf-8 -*-
import os, sys

from css_part1 import PART1
from css_part2 import PART2
from css_part3 import PART3
from css_part4 import PART4
from css_part5 import PART5

full_css = "\n\n".join([PART1, PART2, PART3, PART4, PART5])

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css_dest1 = os.path.join(base_dir, 'public', 'css', 'style.css')
css_dest2 = os.path.join(base_dir, 'public', 'style.css')

with open(css_dest1, 'w', encoding='utf-8') as f:
    f.write(full_css)

with open(css_dest2, 'w', encoding='utf-8') as f:
    f.write(full_css)

print(f"Successfully compiled White & Gold Luxury CSS: {len(full_css)} bytes written to both destinations.")
