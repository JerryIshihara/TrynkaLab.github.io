import {
  publications,
  type Publication,
} from '../../generated/publications';
import './index.css';

interface PublicationSection {
  label: string;
  items: readonly Publication[];
}

const preprints = publications.filter(({ type }) => type === 'preprint');
const articleYears = [
  ...new Set(
    publications.filter(({ type }) => type === 'article').map(({ year }) => year),
  ),
].sort((left, right) => right - left);

const publicationSections: PublicationSection[] = [
  ...(preprints.length > 0 ? [{ label: 'Preprints', items: preprints }] : []),
  ...articleYears.map((year) => ({
    label: String(year),
    items: publications.filter(
      (publication) => publication.type === 'article' && publication.year === year,
    ),
  })),
];

function sectionId(label: string) {
  return label.toLowerCase().replaceAll(' ', '-');
}

export function PublicationsPage() {
  return (
    <main className="publications-page">
      <header className="publications-page__header">
        <h1>Publications</h1>
        <p>* / † indicates co-first / co-senior authorship.</p>

        <nav className="publications-page__years" aria-label="Publication years">
          {publicationSections.map(({ label }) => (
            <a href={`#${sectionId(label)}`} key={label}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="publications-page__sections">
        {publicationSections.map(({ items, label }) => (
          <section id={sectionId(label)} key={label}>
            <h2>{label}</h2>

            <div className="publications-page__list">
              {items.map((item) => (
                <article className="publication-item" key={item.id}>
                  <h3>
                    <a href={item.url} rel="noreferrer" target="_blank">
                      {item.title}
                    </a>
                  </h3>
                  <p className="publication-item__authors">{item.authors.join(', ')}</p>
                  <p className="publication-item__venue">
                    {[item.venue, item.citation, item.year].filter(Boolean).join(' · ')}
                  </p>
                  {item.summary ? (
                    <p className="publication-item__summary">{item.summary}</p>
                  ) : null}
                  <div className="publication-item__links">
                    <a href={item.url} rel="noreferrer" target="_blank">
                      {item.doi ? `DOI: ${item.doi}` : 'Read publication'}
                    </a>
                    {item.codeUrl ? (
                      <a href={item.codeUrl} rel="noreferrer" target="_blank">
                        Code
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
