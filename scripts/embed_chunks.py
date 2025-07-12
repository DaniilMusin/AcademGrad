import os, markdown, psycopg2, tiktoken, openai
from bs4 import BeautifulSoup

CONN = psycopg2.connect(os.getenv("SUPABASE_DB_URL"))
cur = CONN.cursor()
enc = tiktoken.encoding_for_model("text-embedding-3-small")

def chunks(txt, max_tok=400):
    t = enc.encode(txt)
    for i in range(0, len(t), max_tok):
        yield enc.decode(t[i : i+max_tok])

cur.execute("select id, solution_md from tasks")
for tid, md in cur.fetchall():
    text = BeautifulSoup(markdown.markdown(md), "html.parser").get_text()
    for ch in chunks(text):
        emb = openai.Embedding.create(
            input=ch,
            model="text-embedding-3-small",
            api_key=os.getenv("OPENAI_API_KEY")
        )["data"][0]["embedding"]
        cur.execute(
            "insert into task_chunks(task_id,chunk,embedding) values (%s,%s,%s)",
            (tid, ch, emb))
CONN.commit()
