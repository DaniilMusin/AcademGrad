import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

interface Props {
  task: {
    id: number;
    topic: string;
    difficulty: number;
    statement_md: string;
  };
}

export default function TaskCard({ task }: Props) {
  return (
    <article className="prose max-w-none border rounded p-6 bg-white">
      <h2>{`Задача №${task.id} (${task.topic})`}</h2>
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex()]}
        components={{
          p: (props) => <p className="whitespace-pre-wrap">{props.children}</p>,
        }}
      >
        {task.statement_md}
      </Markdown>
    </article>
  );
}
