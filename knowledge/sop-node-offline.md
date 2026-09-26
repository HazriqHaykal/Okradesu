# SOP: a farm's sensor node is offline
Topic: sop

## What offline means
A farm counts as offline when the LoRa gateway has heard nothing from its sensor node for 5 minutes. The farm keeps running: its local controller keeps the lights, watering and fans on schedule, and it saves readings to upload when the link is back. Commands sent from the app wait at the gateway as "queued" and run when the link returns.

## Checks, in order
First check power: for an outdoor solar node, look at the battery level and whether the solar panel is dirty or shaded; for an indoor node, check the mains adapter. Second, check that the antenna is attached and upright. Third, check whether other farms on the same gateway are also offline; if they all are, the problem is the gateway or its internet connection, not the node.

## If the gateway is down
Check the gateway's power and its internet router. Every farm keeps running on its own controller meanwhile, so there is no need to rush to each farm; readings are buffered and upload when the gateway reconnects.

## After the node comes back
Confirm in the app that readings are updating again ("updated a few seconds ago") and that any queued commands have run. Note how long the node was offline, in case it needs a new battery or a better antenna position.
