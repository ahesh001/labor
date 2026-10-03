import { useEffect, useState } from 'react';

const feedUrl = 'https://heshware.it.com/updates/feed.json';

export default function HeshwareUpdates() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(feedUrl, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Feed unavailable');
        return response.json();
      })
      .then(feed => setPosts(Array.isArray(feed.posts) ? feed.posts.slice(0, 2) : []))
      .catch(error => { if (error.name !== 'AbortError') setPosts([]); });
    return () => controller.abort();
  }, []);

  return <section className="card panel" aria-label="Heshware project updates">
    <div className="panel-header"><h2>Heshware updates</h2><a className="secondary-link" href="https://heshware.it.com/updates" target="_blank" rel="noreferrer">All updates</a></div>
    {posts === null && <p>Loading project updates…</p>}
    {posts?.length === 0 && <p>Project updates are temporarily unavailable. Visit Heshware for the latest news.</p>}
    {posts?.length > 0 && <div className="signal-list">{posts.map(post => <div className="signal-item" key={post.slug}>
      <strong><a href={`https://heshware.it.com/updates/${encodeURIComponent(post.slug)}`} target="_blank" rel="noreferrer">{post.title}</a></strong>
      <p>{post.date} · {post.summary}</p>
    </div>)}</div>}
  </section>;
}

