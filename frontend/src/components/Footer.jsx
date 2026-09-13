import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <Link to="/legal/privacy-policy">Privacy Policy</Link>
      <span>·</span>
      <Link to="/legal/terms-of-service">Terms of Service</Link>
      <span>·</span>
      <Link to="/status">System Status</Link>
    </footer>
  );
}
