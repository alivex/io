# io

[![Build Status](https://travis-ci.org/advertima/io.svg?branch=development)](https://travis-ci.org/advertima/io)

IO Javascript utilities to connect to a POI

## Installation

```
$ npm install @advertima/io --save
```
The @advertima/io type definitions are included in the npm package.



## Basics

```js
import {IO} from '@advertima/io';

const io = new IO(); // optionally you can pass a WSConnection instance. By default it will use an instance of TecWSConnection

io.connect({
  jsonHost: '127.0.0.1', // default to localhost
  jsonPort: 1234, // default to 8001
  binaryHost: '127.0.0.1', // default to localhost
  binaryPort: 3030, // default to 8002
});

io.rpc('analytics', data);
io.rpc('download', data).subscribe(res => ...);

io.updateResolutions({
  canvas: {width: 320, width: 480},
  image: {width: 100, width: 100},
  thumbnail: {width: 1920, width: 1080},
})

io.jsonStreamMessages().subscribe(msg => ...);
io.skeletonStreamMessages(1920, 1080).subscribe(msg => ...);
io.imageStreamMessages().subscribe(msg => ...);
io.thumbnailStreamMessages(100, 100).subscribe(msg => ...);
io.heatmapStreamMessages().subscribe(msg => ...);
io.depthmapStreamMessages().subscribe(msg => ...);

io.getSnapshots().subscribe(snapshot => ...);

io.reportStartPlayout(33);
io.reportEndPlayout(33);
```
