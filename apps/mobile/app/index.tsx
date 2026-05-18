import { Redirect } from 'expo-router';

// DEV BYPASS — skip auth to preview UI
export default function Index() {
  return <Redirect href="/(passenger)" />;
}
