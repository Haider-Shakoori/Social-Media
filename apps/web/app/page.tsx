const cards = [
  { step: '01', title: 'Create', detail: 'Build brand-consistent captions and branded images with quota-aware AI tools.' },
  { step: '02', title: 'Review', detail: 'Approve the exact content version in-app, by email, or through an optional messaging integration.' },
  { step: '03', title: 'Schedule', detail: 'Plan recurring posts in your timezone. Publish only through an authorized, supported connection.' },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header shell">
        <a className="brand" href="/" aria-label="Social-Media home"><span className="brand-icon">S</span><strong>Social-Media</strong><span className="brand-label">Early access</span></a>
        <nav aria-label="Main navigation"><a href="#features">Features</a><a href="#how">How it works</a><a href="#availability">Availability</a></nav>
        <span className="top-note">Private beta in development</span>
      </header>
      <section className="hero shell">
        <p className="eyebrow"><span className="live-dot" /> ONE WORKFLOW. HUMAN-APPROVED CONTENT.</p>
        <h1>Create better content. <span>Approve before it goes live.</span></h1>
        <p className="subtitle">AI-assisted content planning, a clean calendar and responsible publishing for small businesses and agencies. Built around reliable approval—not blind automation.</p>
        <div className="hero-actions"><a className="button primary" href="#how">Explore the workflow</a><a className="button secondary" href="#availability">See launch scope</a></div>
        <p className="hero-foot">No social network connections are currently enabled. This site is an early foundation, not an active publishing service.</p>
        <div className="preview" aria-label="Illustrative content workflow preview">
          <div className="preview-top"><span>Content pipeline</span><span className="preview-status">Concept preview</span></div>
          <div className="preview-grid">
            <div><small>01 / Draft</small><strong>Brand content</strong><span>Editable captions and visuals</span></div>
            <div><small>02 / Approve</small><strong>Human review</strong><span>Version-locked decisions</span></div>
            <div><small>03 / Publish</small><strong>Safe scheduling</strong><span>Only eligible integrations</span></div>
          </div>
        </div>
      </section>
      <section className="section shell" id="features">
        <p className="eyebrow">DESIGNED FOR CONTROL</p>
        <h2>Everything needed for a transparent content workflow.</h2>
        <div className="card-grid">
          <article className="feature-card"><div className="feature-symbol">✦</div><h3>AI-assisted drafts</h3><p>Create captions and imagery with strict usage limits and brand context.</p></article>
          <article className="feature-card"><div className="feature-symbol">✓</div><h3>Approval-first</h3><p>Changes invalidate previous approval. Every action has a traceable status.</p></article>
          <article className="feature-card"><div className="feature-symbol">◷</div><h3>Scheduling</h3><p>Keep weekly plans and recurring special occasions organized by timezone.</p></article>
          <article className="feature-card"><div className="feature-symbol">◇</div><h3>Account protection</h3><p>Stop on restrictions, verify permissions and never promise ban-proof automation.</p></article>
        </div>
      </section>
      <section className="section shell" id="how">
        <p className="eyebrow">THE THREE-STEP PROCESS</p><h2>From idea to approved calendar.</h2>
        <div className="workflow">{cards.map((card) => <article key={card.step} className="workflow-step"><span>{card.step}</span><h3>{card.title}</h3><p>{card.detail}</p></article>)}</div>
      </section>
      <section className="section shell" id="availability"><div className="availability"><p className="eyebrow">LAUNCH PLAN</p><h2>Honest platform availability.</h2><p>Official publishing integrations will be activated only when the required app permissions and tests are complete. Experimental connectors stay off for customers; unsupported networks use a manual export workflow.</p><div className="availability-badges"><span>Official APIs first</span><span>Free-tier AI budgets</span><span>Manual fallback</span><span>Tenants isolated</span></div></div></section>
      <footer className="shell footer"><strong>Social-Media</strong><span>Foundation preview · Not a live public service</span></footer>
    </main>
  );
}
