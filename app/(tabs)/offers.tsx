import { Redirect } from 'expo-router';

export default function OffersShortcutScreen() {
  return (
    <Redirect
      href={{
        pathname: '/(tabs)/products',
        params: { hasActiveOffer: 'true' },
      }}
    />
  );
}
