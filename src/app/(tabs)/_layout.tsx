import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { House, Leaf, Sparkles, Sprout, Store } from 'lucide-react-native';

import { FloatingTabBar, TabButton } from '@/components/floating-tab-bar';

export default function TabLayout() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <FloatingTabBar>
          <TabTrigger name="home" href="/home" resetOnFocus asChild>
            <TabButton icon={House} label="Home" />
          </TabTrigger>
          <TabTrigger name="harvest" href="/harvest" resetOnFocus asChild>
            <TabButton icon={Sprout} label="Harvest" />
          </TabTrigger>
          <TabTrigger name="advisor" href="/advisor" asChild>
            <TabButton icon={Sparkles} label="Okradesu AI" highlight />
          </TabTrigger>
          <TabTrigger name="disease" href="/disease" asChild>
            <TabButton icon={Leaf} label="Disease" />
          </TabTrigger>
          <TabTrigger name="market" href="/market" asChild>
            <TabButton icon={Store} label="Market" />
          </TabTrigger>
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}
