import re,sys,html
def conv(path):
    s=open(path).read()
    body=s[s.index('\\begin{document}'):s.index('\\end{document}')]
    title=re.search(r'\\title\{(.*)\}',body).group(1)
    author=re.search(r'\\author\{(.*)\}',body).group(1)
    th=re.search(r'^\\thanks\{(.*)\}',body,re.M); thanks=th.group(1) if th else None
    abstract=re.search(r'\\begin\{abstract\}(.*?)\\end\{abstract\}',body,re.S).group(1)
    main=body[body.index('\\maketitle'):]
    # strip comments
    strip=lambda t:'\n'.join(re.sub(r'(?<!\\)%.*$','',l) for l in t.split('\n'))
    main=strip(main); abstract=strip(abstract)
    for k in ['\\maketitle','\\newpage']: main=main.replace(k,'')
    main=re.sub(r'\\thispagestyle\{\w+\}','',main); main=re.sub(r'\\numberwithin\{[^}]*\}\{[^}]*\}','',main)
    main=re.sub(r'\\vspace\{[^}]*\}','',main); main=re.sub(r'\\label\{[^}]*\}','',main)
    fns=[]
    def inline(t):
        # protect math first, then typographic quotes
        maths=[]
        def keep(m): maths.append(m.group(0)); return f'\x00{len(maths)-1}\x00'
        t=re.sub(r'\$[^$]+\$',keep,t)
        t=t.replace('``','“').replace("''",'”').replace('"','”').replace("'",'’')
        t=re.sub(r'\\footnote\{([^}]*)\}',lambda m:(fns.append(m.group(1)) or f'[^{len(fns)}]'),t)
        t=re.sub(r'\\href\{([^}]*)\}\{\\textbf\{([^}]*)\}\}',r'<a class="tl" href="\1"><b>\2</b></a>',t)
        t=re.sub(r'\\href\{([^}]*)\}\{([^}]*)\}',r'<a class="tl" href="\1">\2</a>',t)
        t=re.sub(r'\\textbf\{([^}]*)\}',r'<b>\1</b>',t)
        t=re.sub(r'\\textit\{([^}]*)\}',r'<i>\1</i>',t)
        t=t.replace('\\qed','<span class="qed">$\\heartsuit$</span>')
        t=re.sub(r'[ \t]+',' ',t)
        t=re.sub(r'\x00(\d+)\x00',lambda m:maths[int(m.group(1))],t)
        return t
    out=[]; sec=-1; thm=0
    # tokenise blocks
    pos=0
    pat=re.compile(r'\\section\{([^}]*)\}|\\begin\{theorem\}(\[[^\]]*\])?(.*?)\\end\{theorem\}|\\begin\{proof\}(.*?)\\end\{proof\}|\\begin\{enumerate\}(.*?)\\end\{enumerate\}|\\\[(.*?)\\\]|\\begin\{align\*\}(.*?)\\end\{align\*\}',re.S)
    def text(t):
        for para in re.split(r'\n\s*\n',t):
            p=' '.join(x.strip() for x in para.strip().split('\n')).strip()
            if p: out.append(inline(p))
    def disp(m):
        m=m.strip()
        one=re.fullmatch(r'\\begin\{aligned\}\s*&(.*?)&(.*?)\\end\{aligned\}',m,re.S)
        if one and '\\\\' not in m: m=one.group(1).strip()+' \\hspace{7em} '+one.group(2).strip()
        out.append('$$\n'+m+'\n$$')
    for m in pat.finditer(main):
        text(main[pos:m.start()]); pos=m.end()
        if m.group(1) is not None:
            sec+=1; thm=0; out.append(f'<h2 class="sec">{sec}. {inline(m.group(1))}</h2>')
        elif m.group(3) is not None:
            thm+=1; name=f' ({m.group(2)[1:-1]})' if m.group(2) else ''
            inner=m.group(3).strip()
            parts=re.split(r'\\\[(.*?)\\\]',inner,flags=re.S)
            lead=parts[0].strip()
            head=f'<b>Theorem {sec}.{thm}</b>{name}<b>.</b>'
            out.append(f'<div class="thm">\n\n{head}'+(f' <i>{inline(lead)}</i>' if lead else '')+'\n\n'+''.join(f'$$\n{parts[i].strip().replace(chr(92)+"text{", chr(92)+"textit{")}\n$$\n\n' for i in range(1,len(parts),2))+'</div>')
        elif m.group(4) is not None:
            inner=m.group(4).strip()
            sub=[]; p2=0
            for mm in re.finditer(r'\\\[(.*?)\\\]|\\begin\{align\*\}(.*?)\\end\{align\*\}',inner,re.S):
                sub.append(('t',inner[p2:mm.start()])); sub.append(('m',mm.group(1) if mm.group(1) is not None else '\\begin{aligned}'+mm.group(2)+'\\end{aligned}')); p2=mm.end()
            sub.append(('t',inner[p2:]))
            first=True
            for k,v in sub:
                if k=='m': disp(v); continue
                for para in re.split(r'\n\s*\n',v):
                    p=' '.join(x.strip() for x in para.strip().split('\n')).strip()
                    if not p: continue
                    if first: p='<i>Proof.</i> '+p; first=False
                    out.append(inline(p))
            out[-1]=out[-1]+' <span class="qed">$\\heartsuit$</span>'
        elif m.group(5) is not None:
            items=[x.strip() for x in re.split(r'\\item',m.group(5)) if x.strip()]
            out.append('\n'.join(f'{i+1}. {inline(" ".join(it.split()))}' for i,it in enumerate(items)))
        elif m.group(6) is not None: disp(m.group(6))
        elif m.group(7) is not None: disp('\\begin{aligned}'+m.group(7)+'\\end{aligned}')
    text(main[pos:])
    for i,f in enumerate(fns): out.append(f'[^{i+1}]: {inline(f)}')
    return dict(title=title,author=author,thanks=thanks,abstract=inline(' '.join(abstract.split())),body='\n\n'.join(out)+'\n')

# Usage: python3 scripts/tex2md.py papers/sizes-of-z.tex  -> rewrites the body of src/content/posts/sizes-of-z.md
if __name__ == '__main__':
    import os, json
    for path in sys.argv[1:]:
        slug = os.path.splitext(os.path.basename(path))[0]
        md = f'src/content/posts/{slug}.md'
        d = conv(path)
        fm = open(md).read().split('---\n')[1]
        keep = '\n'.join(l for l in fm.split('\n') if l and not l.startswith(('paperTitle:', 'author:', 'thanks:')))
        head = keep + f'\npaperTitle: {json.dumps(d["title"])}\nauthor: {json.dumps(d["author"])}\n' + (f'thanks: {json.dumps(d["thanks"])}\n' if d['thanks'] else '')
        ab = f'<div class="ab">\n\n<span class="sc">Abstract.</span> {d["abstract"]}\n\n</div>\n\n'
        open(md, 'w').write('---\n' + head + '---\n\n' + ab + d['body'])
        print('wrote', md)
