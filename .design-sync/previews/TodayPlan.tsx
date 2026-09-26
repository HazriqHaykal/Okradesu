import { Icons, TodayPlan, type Task } from '@okradesu/ui';

const tasks: Task[] = [
  {
    id: 'pick-field-a',
    icon: Icons.Sprout,
    title: 'Pick 34 pods at Field A',
    detail: 'Before 11:00, ahead of the rain',
    farmId: 'field-a',
  },
  {
    id: 'water',
    icon: Icons.CloudRain,
    title: 'Water Hillside now',
    detail: 'Soil is 24%, below the 30% alert line',
    farmId: 'hillside',
    urgent: true,
  },
  {
    id: 'pick-gym',
    icon: Icons.Sprout,
    title: 'Pick 26 pods at Gymnasium',
    detail: 'Before 11:00, under 10 cm',
    farmId: 'gymnasium',
  },
  {
    id: 'ec',
    icon: Icons.Leaf,
    title: 'Add fertiliser at Field A',
    detail: 'Nutrients is 1.0 mS/cm, target 1.2–2.0',
    farmId: 'field-a',
  },
  {
    id: 'node',
    icon: Icons.RadioTower,
    title: 'Check the LoRa node at House 4',
    detail: 'Farms are running on their own controllers for now',
    farmId: 'house-4',
  },
];

/** Home: the top three tasks, with progress counting all five. */
export const TopThree = () => (
  <div style={{ width: 360 }}>
    <TodayPlan tasks={tasks} limit={3} onOpen={() => {}} />
  </div>
);

/** The full list, with an urgent task in red. */
export const AllTasks = () => (
  <div style={{ width: 360 }}>
    <TodayPlan tasks={tasks} onOpen={() => {}} />
  </div>
);
