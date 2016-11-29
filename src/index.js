import mware from 'mware-async';
import inquirer from 'inquirer';
import ora from 'ora';
import ms from 'pretty-ms';
import yargs from 'yargs';
import Promise from 'any-promise';
import defaults from 'defaults';

export default (module) => {
    const inquire = module || inquirer.createPromptModule();
    const stack = [];

    return {
        use(fn) {
            stack.push(fn);
        },

        run(opts) {
            // run options
            const options = defaults(opts, {
                args: true,
                spinner: true,
                time: true,
            });

            const middleware = mware(); // for action handlers
            const questions = []; // inquirer questions

            // use cli args for question defaults
            let argv;
            if (options.args) {
                argv = yargs.argv;
            }

            // middleware prompt function
            const prompt = (q) => {
                const val = argv && argv[q.name];
                // add cli arg as default question value
                if (val !== undefined) {
                    q.default = val; // eslint-disable-line no-param-reassign
                }
                questions.push(q);
            };

            // run middleware and add action handlers to mware
            stack.forEach(fn => middleware.use(fn(prompt)));

            return inquire(questions).then((answers) => {
                const spinner = options.spinner ? ora() : null;
                const status = (text) => {
                    if (spinner) {
                        spinner.text = text;
                    }
                };

                // start the spinner
                if (spinner) {
                    spinner.color = 'dim';
                    spinner.start();
                }

                const start = options.time ? Date.now() : null;

                // run answers handlers
                return middleware.run(answers, status).then(() => {
                    // succeed the spinner
                    if (spinner) {
                        let msg = 'Done';

                        // add time taken to status
                        if (start) {
                            const time = ms(Date.now() - start);
                            msg = `${msg} in ${time}`;
                        }

                        status(`${msg}.`);
                        spinner.succeed();
                    }

                    return answers;
                }, (err) => {
                    // fail spinner
                    if (spinner) {
                        status(err.message);
                        spinner.fail();
                    }
                    return Promise.reject(err);
                });
            });
        },
    };
};
