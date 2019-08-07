# inquisitive

[![Build Status](https://travis-ci.org/9technology/inquisitive.svg?branch=master)](https://travis-ci.org/9technology/inquisitive) [![Coverage Status](https://coveralls.io/repos/github/9technology/inquisitive/badge.svg?branch=master)](https://coveralls.io/github/9technology/inquisitive?branch=master)

[Inquirer](https://www.npmjs.com/package/inquirer) middleware engine. Create interactive cli prompts with a middleware engine for handling individual answers.

## Example

```javascript
import '@babel/register'; // enable async/await
import inquisitive from 'inquisitive';
import delay from 'delay';

const inq = inquisitive();

// define a prompt with a middleware handler
inq.use((prompt) => {
    // ask a question
    prompt({
        name: 'name',
        message: 'What is your name',
    });

    // handle the answers
    return async (answers, status, next) => {
        if (answers.name !== 'Nicolas Cage') {
            throw new Error('Legends only');
        }
        await delay(1000);
        await next(); // go to next handler
    };
});

inq.run(); // start asking
```

## Installation

### NPM

```sh
npm install --save inquisitive
```

### Yarn

```sh
yarn add inquisitive
```

## Setup

Inquisitive uses [async/await](https://github.com/tc39/ecmascript-asyncawait), until this is available for production it is recommended to transpile with [Babel](http://babeljs.io/).

Use the transform plugin, [babel-plugin-transform-async-to-generator](http://babeljs.io/docs/plugins/transform-async-to-generator/).

## Usage

### Middleware

The concept of middleware in inquisitive is slightly different than common patterns like in [Express](https://www.npmjs.com/package/express) or [Koa](https://www.npmjs.com/package/koa). A middleware function is invoked immediately.

Middleware functions have two jobs, _ask questions_ and _handle answers_. Both of which are optional.

#### Questions

Middleware functions will be given a `prompt` function as it's only argument. This `prompt` function should be called to add questions to [inquirer](https://www.npmjs.com/package/inquirer).

```javascript
inq.use((prompt) => {
    // ask anything
    prompt({
        name: 'first',
        message: 'What is your first name:',
    });
    // and many more...
    prompt({
        name: 'last',
        message: 'What is your last name:',
    });
});
```

Asking questions is completely optional. In some cases only an answers handler is required as prior middleware may have asked all the questions.

##### Questions Format

See inquirer [Questions](https://www.npmjs.com/package/inquirer#questions).

#### Answers Handler

Once [inquirer](https://www.npmjs.com/package/inquirer) has complete the answers it will run through the answer handlers. To give a handler to inquisitive just return an async function from the middleware function.

Answer handler functions take 3 arguments, `answers`, `status` and `next`.

```javascript
inq.use((prompt) => {
    // ask questions?
    return async (answers, status, next) => {
        status('checking something'); // update spinner text
        doSomething(answers.foo); // handle answers
        await next(); // don't forget to move next
    };
});
```

Handling answers is also optional. Some middleware may just want to ask questions and have another middleware handle the answers.

### Running Cli

To run the interactive prompt call `#run()` on the inquisitive instance. `run` also takes a few options to control how inquisitive will report to the terminal.

```javascript
inq.run({
    args: true,       // read cli args and set question default values
    spinner: true,    // enable/disable spinner
    time: true,       // enable/disable time message at end
});
```

#### Args Defaults

Inquisitive has the ability to read args from the terminal and set them as the defaults for questions. This is a convenience options enabled by default.

_cli.js_

```javascript
inq.use((prompt) => {
    prompt({
        name: 'name',
        message: 'What is your name:',
    });
});
inq.run();
```

```sh
node cli.js --name "Nicolas Cage"
? What is your name: (Nicolas Cage) _
```

### Custom Inquirer

It is also possible to give a custom built [inquirer](https://www.npmjs.com/package/inquirer#inquirercreatepromptmodule---prompt-function) module to inquisitive. Just pass it into the factory method when creating an instance.

```javascript
import inquirer from 'inquirer';
import inquisitive from 'inquisitive';

const custom = inquirer.createPromptModule();
// apply customisations
const inq = inquisitive(custom);
```

## API

##### `inquisitive([module])`
* `module: Function` Custom [inquirer](https://www.npmjs.com/package/inquirer#inquirercreatepromptmodule---prompt-function) module.

Returns inquisitive instance.

#### Instance

##### `#use(fn)`
* `fn: Function` Middleware function to add to instance.

##### `#run([opts])`
* `otps: Object` Run options.
    * `opts.args: Boolean` Enable/disable argument defaults.
    * `opts.spinner: Boolean` Enable/disable spinner.
    * `opts.time: Boolean` Enable/disable time feedback on success.

Returns Promise, resolving `answers`.

## License

[BSD-3-Clause](LICENSE)

Copyright (c) 2016 [9Technology](https://github.com/9technology)
