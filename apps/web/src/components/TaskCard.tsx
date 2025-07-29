import { memo, lazy, Suspense } from "react";

const LazyMarkdown = lazy(() => import("react-markdown"));
const LazyRehypeKatex = lazy(() => import("rehype-katex"));
const LazyRemarkMath = lazy(() => import("remark-math"));

interface Props {
  task: {
    id: number;
    topic: string;
    difficulty: number;
    statement_md: string;
  };
}

const TaskCard = memo(({ task }: Props) => {
  const hasMath = task.statement_md.includes('$') || task.statement_md.includes('\\(');
  
  const components = {
    h1: ({ children }: any) => (
      <h1 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
        {children}
      </h2>
    ),
    p: (props: any) => (
      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-4">
        {props.children}
      </p>
    ),
    strong: ({ children }: any) => (
      <strong className="font-bold text-blue-600">{children}</strong>
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
        {children}
      </blockquote>
    ),
  };

  return (
    <article className="prose prose-lg max-w-none">
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded"></div>}>
        {hasMath ? (
          <LazyMarkdown
            remarkPlugins={[LazyRemarkMath]}
            rehypePlugins={[LazyRehypeKatex]}
            components={components}
          >
            {task.statement_md}
          </LazyMarkdown>
        ) : (
          <LazyMarkdown components={components}>
            {task.statement_md}
          </LazyMarkdown>
        )}
      </Suspense>
    </article>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
