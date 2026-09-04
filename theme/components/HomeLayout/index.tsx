import { HorizontalScroller } from '../HorizontalScroller';
import { SiteFooter } from '../SiteFooter';
import './index.css';

const researchItems = [
  {
    title: 'Research area one',
    description:
      'Add a short description of this research area, including the question, approach, and expected impact.',
  },
  {
    title: 'Research area two',
    description:
      'Use this space to introduce another research direction and explain why it matters in a few concise sentences.',
  },
  {
    title: 'Research area three',
    description:
      'Summarize the focus of this research area here. Supporting publications and project links can be added later.',
  },
];

export function HomeLayout() {
  return (
    <>
      <main className="home-layout">
        <HorizontalScroller className="home-layout__scroller">
          <div className="card home-layout__banner-summary">
            <p className="home-layout__banner-area">Immune Genomics Group</p>
            <h1>Trynka Group</h1>
            <p className="home-layout__banner-mission">
              We investigate how genetic variation shapes immune cell function and
              contributes to human disease, connecting genetic associations to mechanisms
              and opportunities for therapeutic discovery.
            </p>
          </div>
        </HorizontalScroller>

        <section className="home-layout__research" aria-labelledby="research-title">
          <h2 id="research-title">Research</h2>

          <div className="home-layout__research-items">
            {researchItems.map((item, index) => {
              const imagePosition = index % 2 === 0 ? 'left' : 'right';

              return (
                <article
                  className={`research-item research-item--image-${imagePosition}`}
                  key={item.title}
                >
                  <div
                    className="card research-item__image"
                    aria-label={`${item.title} image placeholder`}
                  >
                    <span>Image placeholder</span>
                  </div>

                  <div className="research-item__content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
