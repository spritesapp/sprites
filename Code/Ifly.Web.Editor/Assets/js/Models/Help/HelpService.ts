/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/q.d.ts" />

module Ifly.Models.Help {
    /** Represents a help service. */
    export class HelpService extends Ifly.EventSource {
        /**
         * Initializes a new instance of an object.
         */
        constructor() {
            super();
        }

        /**
         * Returns the topic with the given Id/Reference key.
         * @param id {string} Topic Id (or reference key).
         * @returns {Q.Promise} A promise which, when resolves, passes topic.
         */
        public getTopic(id: string): Q.Promise<HelpTopic> {
            var deferred = Q.defer<HelpTopic>();

            Q.when()
                .then(() => {
                    var task = Q.defer();

                    Ifly.App.getInstance().api.get('help/' + encodeURIComponent(id), null, (success, data) => {
                        task.resolve(data);
                    }, true);

                    return task.promise;
                })
                .then(data => {
                    deferred.resolve(new HelpTopic(data));
                })
                .catch(err => {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        /**
         * Returns all topics that match the given term.
         * @param term {string} Search term.
         * @param offset {number} Search result offset.
         * @returns {Q.Promise} A promise which, when resolves, passes matching topics.
         */
        public searchForTopics(term: string, offset?: number): Q.Promise<HelpTopicSearchResultSet> {
            var deferred = Q.defer<HelpTopicSearchResultSet>();

            Q.when()
                .then(() => {
                    var task = Q.defer();

                    Ifly.App.getInstance().api.get('help/search?term=' + encodeURIComponent(term) +
                        (typeof (offset) !== 'undefined' && offset !== null ? ('&offset=' + encodeURIComponent(offset.toString())) : ''), null, (success, data) => {

                        task.resolve(success ? data : {});
                    });

                    return task.promise;
                })
                .then(data => {
                    deferred.resolve(new HelpTopicSearchResultSet(data));
                })
                .catch(err => {
                    deferred.reject(err);
                });

            return deferred.promise;
        }
    }
}