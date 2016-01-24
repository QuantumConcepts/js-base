import * as Util from "util";
import * as Querystring from "querystring";
import {SearchCriteria} from "./SearchCriteria";
import {SearchKeys} from "./SearchKeys";
import {ArgumentNullError} from "./ArgumentNullError";

export class Search {
    public criteria = new Array<SearchCriteria>();

    public static parseString(querystring: string): Search {
        if (!querystring) return null;

        var query = Querystring.parse(querystring);
        
        return Search.parse(query);
    }
    
    public static parse(query: any): Search {
        var searchParameter = query[SearchKeys.search];
        var search = new Search();

        if (searchParameter != null) {
            try {
                searchParameter = JSON.parse(searchParameter);
            }
            catch (err) {
                throw Error(Util.format("Parameter \"%s\" could not be parsed as JSON: %s", SearchKeys.search, err));
            }

            for (var key in searchParameter) {
                var rawCriteria = searchParameter[key];
                var criteria = new SearchCriteria(rawCriteria.fieldName, rawCriteria.operator, rawCriteria.value);

                try {
                    criteria.validate();
                }
                catch (err) {
                    throw Util.format("Search criteria for \"%s\" could not be validated: %s", key, err);
                }

                search.criteria.push(criteria);
            }
        }

        for (var key in query) {
            // Only parse keys which are not "special".
            if (SearchKeys[key] == null) {
                var criteria = SearchCriteria.parse(key, query[key]);

                if (criteria != null) {
                    try {
                        criteria.validate();
                    }
                    catch (err) {
                        throw Error(Util.format("Search criteria for \"%s\" could not be validated: %s", key, err));
                    }

                    search.criteria.push(criteria);
                }
            }
        }

        return search;
    };
}