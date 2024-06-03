#!/usr/bin/env node
"use strict";

require("ts-node").register({});
require("../index.ts")
  .run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
