test set of:
  * 2 root collections containing 8 "level0" documents each
  * each "level0" document has between 3 and 4 subcollections itself
  * each subcollection contains a varying amount of "level1" documents ranging from 0 to 12,000

`backupDocument` with a concurrency of:
  * 1 - backuptime: 479421.435 ms = ~8 mins
  * 3 - backuptime: 232267.139 ms = ~3.8 mins
    * ~48% reduction of time
    * **diminishing return tipping point**
  * 20 - backuptime: 238634.216 ms = ~3.9 mins

`backupDocument` with a concurrency of 3 and `backupCollection` with a concurrency of:
  * 3 - backuptime: 87571.663 ms = ~1.4 mins
    * ~81% reduction of time
  * 20 - backuptime: 28476.332 ms = ~0.4 mins
    * ~95% reduction of time
