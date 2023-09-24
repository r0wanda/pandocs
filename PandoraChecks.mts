export namespace PandoraChecks {
    export function isGraphQL(r: PandoraRest): r is PandoraRest.GraphQL {
        return !!r.data;
    } 
}