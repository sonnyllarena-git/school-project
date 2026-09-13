// Must match backend/src/lib/curriculum.js GRADING_PERIODS — used only to
// order quarters correctly (First → Fourth), since the DB doesn't guarantee
// that order for a free-text column.
const GRADING_PERIODS = ['First Grading', 'Second Grading', 'Third Grading', 'Fourth Grading'];

export default function GradesView({ grades }) {
  if (!grades) return <div className="empty-state">Loading…</div>;
  if (grades.length === 0) return <div className="empty-state">No grades recorded yet.</div>;

  const byPeriod = grades.reduce((acc, g) => {
    (acc[g.grading_period] ||= []).push(g);
    return acc;
  }, {});
  const periods = Object.keys(byPeriod).sort(
    (a, b) => GRADING_PERIODS.indexOf(a) - GRADING_PERIODS.indexOf(b)
  );

  return (
    <>
      {periods.map(period => (
        <div className="card" key={period} style={{ marginBottom: 16 }}>
          <h3>{period}</h3>
          <table>
            <thead><tr><th>Subject</th><th>1st Exam</th><th>2nd Exam</th><th>3rd Exam</th><th>Formative</th><th>Final</th></tr></thead>
            <tbody>
              {byPeriod[period].map(g => (
                <tr key={g.subject}>
                  <td>{g.subject}</td>
                  <td>{g.first_period_exam}</td>
                  <td>{g.second_period_exam}</td>
                  <td>{g.third_period_exam}</td>
                  <td>{g.formative_score}</td>
                  <td><strong>{g.final_grade}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
