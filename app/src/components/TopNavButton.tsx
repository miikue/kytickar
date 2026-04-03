export default function TopNavButton() {
  const isDev = window.location.pathname === '/dev';

  return (
    <a className="top-nav-link" href={isDev ? '/' : '/dev'}>
      {isDev ? 'Aplikace' : 'Dev'}
    </a>
  );
}
