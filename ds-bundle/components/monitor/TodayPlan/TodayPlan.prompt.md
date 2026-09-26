TodayPlan from @okradesu/ui. Use via `window.Okradesu.TodayPlan` (bundle loaded from the root `_ds_bundle.js`).

Today's to-do card: a progress bar plus tickable tasks, each with an icon and a tap target that opens its farm.

## Props

```ts
interface TodayPlanProps {
  tasks: Task[];
  onOpen: (farmId: string) => void;
  /** Show only the first N tasks; progress still counts them all. */
  limit?: number;
}
```

## Examples

### TopThree

```jsx
() => (
  <div style={{ width: 360 }}>
    <TodayPlan tasks={tasks} limit={3} onOpen={() => {}} />
  </div>
);

/** The full list, with an urgent task in red. */
```

### AllTasks

```jsx
() => (
  <div style={{ width: 360 }}>
    <TodayPlan tasks={tasks} onOpen={() => {}} />
  </div>
)
```
