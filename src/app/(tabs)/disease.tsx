import { Bell } from 'lucide-react-native';

import { CropScanner } from '@/components/crop-scanner';
import { Screen } from '@/components/screen';
import { IconButton } from '@/components/ui/button';
import { ScreenTitle } from '@/components/ui/section-header';

export default function DiseaseScreen() {
  return (
    <Screen>
      <ScreenTitle
        kicker="Leaf camera · disease risk"
        title="Disease"
        right={<IconButton icon={Bell} label="Alerts, 2 new" href="/alerts" dot />}
      />

      <CropScanner />
    </Screen>
  );
}
