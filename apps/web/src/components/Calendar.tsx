import { format } from "date-fns";

interface Event {
  title: string;
  start: string;
  end: string;
  url?: string;
}

export default function Calendar({ events }: { events: Event[] }) {
  return (
    <table className="table w-full">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Время</th>
          <th>Занятие</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e, i) => (
          <tr key={i}>
            <td>{format(new Date(e.start), "dd.MM")}</td>
            <td>
              {format(new Date(e.start), "HH:mm")}–{format(new Date(e.end), "HH:mm")}
            </td>
            <td>
              {e.url ? (
                <a className="link" href={e.url} target="_blank">
                  {e.title}
                </a>
              ) : (
                e.title
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
