""" Build index from directory listing

make_index.py </path/to/directory> [--header <header text>]
"""
import os
import argparse

# May need to do "pip install mako"
from mako.template import Template


INDEX_TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${header}</title>
</head>
<body>
    <h2>${header}</h2>
    <p>This index has been generated automatically<p>
    <p>Version: ${version}<p>
    <ul>
    % for name in names:
        <li><a href="${name}">${name}</a></li>
    % endfor
    </ul>
</body>
</html>
"""

EXCLUDED = ['index.html']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory")
    parser.add_argument("--header")
    parser.add_argument("--version")
    args = parser.parse_args()
    fnames = [fname for fname in sorted(os.listdir(args.directory))
              if fname not in EXCLUDED]
    header = (args.header if args.header else os.path.basename(args.directory))
    version = (args.version if args.version else "unknown")
    t = Template(INDEX_TEMPLATE).render(
        names=fnames,
        header=header,
        version=version)
    print(t)


if __name__ == '__main__':
    main()
