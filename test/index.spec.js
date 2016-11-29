import test from 'ava';
import proxy from 'proxyquire';
import sinon from 'sinon';

proxy.noCallThru();

const sandbox = sinon.sandbox.create();

const yargs = {};
const argv = {};
const argvGet = sandbox.stub().returns(argv);
Object.defineProperty(yargs, 'argv', { get: argvGet });

const inquire = sandbox.stub().returns(Promise.resolve({}));
const createPromptModule = sandbox.stub().returns(inquire);
const inquirer = { createPromptModule };

const oraStart = sandbox.stub();
const oraSucceed = sandbox.stub();
const oraFailed = sandbox.stub();
const oraInstance = {
    start: oraStart,
    succeed: oraSucceed,
    fail: oraFailed,
};
const oraTextSet = sandbox.stub();
Object.defineProperty(oraInstance, 'text', { set: oraTextSet });
const ora = sandbox.stub().returns(oraInstance);

const ms = sandbox.stub();

const inquisitive = proxy('../src', { inquirer, yargs, ora, ms }).default;

test.beforeEach(() => {
    sandbox.reset();
});

test('creates a instance', (t) => {
    const inq = inquisitive();
    t.is(typeof inq, 'object');
});

test('instance has use method', (t) => {
    const inq = inquisitive();
    t.is(typeof inq.use, 'function');
});

test('instance has run method', (t) => {
    const inq = inquisitive();
    t.is(typeof inq.run, 'function');
});

test('uses default prompt module', async (t) => {
    inquisitive();
    t.truthy(createPromptModule.called);
});

test('uses defaults from yargs', async (t) => {
    const inq = inquisitive();
    await inq.run();
    t.truthy(argvGet.called);
});

test('doesn\'t use default prompt module', async (t) => {
    inquisitive({});
    t.truthy(createPromptModule.notCalled);
});

test('doesn\'t use defaults from yargs', async (t) => {
    const inq = inquisitive();
    await inq.run({ args: false });
    t.truthy(argvGet.notCalled);
});

test('givens middleware prompt', async (t) => {
    const inq = inquisitive();
    const middleware = sinon.stub();
    inq.use(middleware);
    await inq.run();

    t.truthy(middleware.calledWithMatch(
        sinon.match.func,
    ));
});

test('prompt adds question to inquirer', async (t) => {
    const inq = inquisitive();
    const question = { name: 'foo' };
    const middleware = (prompt) => {
        prompt(question);
    };
    inq.use(middleware);
    await inq.run();

    t.deepEqual(inquire.firstCall.args[0], [question]);
});

test('sets default value', async (t) => {
    const inq = inquisitive();
    const question = { name: 'foo' };
    const middleware = (prompt) => {
        prompt(question);
    };
    inq.use(middleware);

    argvGet.returns({ foo: 'bar' });

    await inq.run();

    t.deepEqual(inquire.firstCall.args[0][0].default, 'bar');
});

test('passes answers to middleware', async (t) => {
    const inq = inquisitive();

    const answers = { foo: 'bar' };
    inquire.returns(Promise.resolve(answers));

    const middleware = sandbox.stub();
    inq.use(() => middleware);

    await inq.run();

    t.truthy(middleware.calledWithMatch(
        sinon.match.same(answers),
        sinon.match.func,
    ));
});

test('status updates spinner text', async (t) => {
    const inq = inquisitive();
    inq.use(() => (answers, status) => {
        status('hello');
    });
    await inq.run();

    t.truthy(oraTextSet.calledWith('hello'));
});

test('suceeds spinner on success', async (t) => {
    const inq = inquisitive();
    await inq.run();
    t.truthy(oraSucceed.called);
});

test('fails spinner on rejected middleware', async (t) => {
    const inq = inquisitive();
    const error = new Error('rejected');
    const middleware = () => () => {
        throw error;
    };
    inq.use(middleware);

    try {
        await inq.run();
        t.fail();
    } catch (err) {
        t.truthy(oraFailed.called);
    }
});

test('rejects with same middleware error', async (t) => {
    const inq = inquisitive();
    const error = new Error('rejected');
    const middleware = () => () => {
        throw error;
    };
    inq.use(middleware);

    try {
        await inq.run();
        t.fail();
    } catch (err) {
        t.is(err, error);
    }
});

test('does not start spinner if disabled', async (t) => {
    const inq = inquisitive();
    await inq.run({
        spinner: false,
    });
    t.truthy(oraStart.notCalled);
});

test('does not fail spinner if disabled', async (t) => {
    const inq = inquisitive();
    inq.use(() => () => {
        throw new Error();
    });
    try {
        await inq.run({
            spinner: false,
        });
        t.fail();
    } catch (err) {
        t.truthy(oraFailed.notCalled);
    }
});

test('does not update status spinner if disabled', async (t) => {
    const inq = inquisitive();
    inq.use(() => (a, status) => {
        status('foo');
    });
    await inq.run({
        spinner: false,
    });
    t.truthy(oraTextSet.neverCalledWith('foo'));
});

test('does not feedback time if disabled', async (t) => {
    const inq = inquisitive();
    await inq.run({
        time: false,
    });
    t.truthy(ms.notCalled);
});
