import { render } from '@react-email/render';

export async function renderEmail(component: React.ReactElement) {
  return render(component);
}
