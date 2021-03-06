[draftail](https://springload.github.io/draftail/) [![npm](https://img.shields.io/npm/v/draftail.svg?style=flat-square)](https://www.npmjs.com/package/draftail) [![Build Status](https://travis-ci.org/springload/draftail.svg?branch=master)](https://travis-ci.org/springload/draftail) [![Coverage Status](https://coveralls.io/repos/github/springload/draftail/badge.svg)](https://coveralls.io/github/springload/draftail) [![Dependency Status](https://david-dm.org/springload/draftail.svg?style=flat-square)](https://david-dm.org/springload/draftail) [![devDependency Status](https://david-dm.org/springload/draftail/dev-status.svg?style=flat-square)](https://david-dm.org/springload/draftail#info=devDependencies) [![Code Climate](https://codeclimate.com/github/springload/draftail/badges/gpa.svg)](https://codeclimate.com/github/springload/draftail)
=========

> A batteries-excluded rich text editor based on [Draft.js](https://facebook.github.io/draft-js/). :memo::cocktail:

This is a work in progress. It is intended to be integrated into [Wagtail](https://wagtail.io/). [Try a demo now](https://springload.github.io/draftail/).

## Usage

First, grab the package from npm:

```sh
npm install --save draftail
# Draftail's peerDependencies:
npm install --save draft-js@^0.10.0 react@^15.0.0 react-dom@^15.0.0
# Note: Draft.js builds upon ES6 language features. If targeting browsers that do not support them,
# see https://facebook.github.io/draft-js/docs/advanced-topics-issues-and-pitfalls.html#polyfills.
```

Then, import the editor and use it in your code. Here is a [basic example](https://springload.github.io/draftail/example.html):

```js
import React from 'react';
import ReactDOM from 'react-dom';

import DraftailEditor, { BLOCK_TYPE, INLINE_STYLE } from 'draftail';

const initialContentState = JSON.parse(sessionStorage.getItem('basic:contentState')) || {};

const onSave = (contentState) => {
    sessionStorage.setItem('basic:contentState', JSON.stringify(contentState));
};

const editor = (
    <DraftailEditor
        rawContentState={initialContentState}
        onSave={onSave}
        blockTypes={[
            { label: 'H3', type: BLOCK_TYPE.HEADER_THREE },
            { label: 'UL', type: BLOCK_TYPE.UNORDERED_LIST_ITEM, icon: 'icon-list-ul' },
        ]}
        inlineStyles={[
            { label: 'Bold', type: INLINE_STYLE.BOLD, icon: 'icon-bold' },
            { label: 'Italic', type: INLINE_STYLE.ITALIC, icon: 'icon-italic' },
        ]}
    />
);

ReactDOM.render(editor, document.querySelector('[data-mount-basic]'));
```

## Development

### Install

> Clone the project on your computer, and install [Node](https://nodejs.org). This project also uses [nvm](https://github.com/springload/frontend-starter-kit/blob/master/docs/useful-tooling.md#nvm).

```sh
nvm install
# Then, install all project dependencies.
npm install
# Install the git hooks.
./.githooks/deploy
# Set up a `.env` file with the appropriate secrets.
touch .env
```

### Working on the project

> Everything mentioned in the installation process should already be done.

```sh
# Make sure you use the right node version.
nvm use
# Start the server and the development tools.
npm run start
# Runs linting.
npm run lint
# Runs tests.
npm run test
# View other available commands with:
npm run
```

### Publish

```sh
git release vx.y.z
npm run dist
# Use irish-pub to check the package content. Install w/ npm install -g first.
irish-pub
npm publish
```
