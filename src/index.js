import mware from 'mware-async';
import inquirer from 'inquirer';
import ora from 'ora';
import ms from 'pretty-ms';
import yargs from 'yargs';
import Promise from 'any-promise';

export default (module, defaults) => {
    const middleware = mware();

    const inquire = module || inquirer.createPromptModule();
    const argv = defaults || yargs.argv;

    const questions = [];
    const prompt = (q) => {
        const val = argv[q.name];
        // add cli args as default
        if (val !== undefined) q.default = val;
        questions.push(q);
    };

    return {
        use(fn) {
            return middleware.use(fn(prompt));
        },

        run() {
            return inquire(questions).then((answers) => {
                const spinner = ora();
                const status = (text) => spinner.text = text;

                spinner.color = 'dim';
                spinner.start();

                const start = Date.now();

                return middleware.run(answers, status).then(() => {
                    const time = ms(Date.now() - start);
                    status(`Done in ${time}.`);
                    spinner.succeed();
                }, (err) => {
                    status(err.message);
                    spinner.fail();
                    return Promise.reject(err);
                });
            });
        },
    };
};
