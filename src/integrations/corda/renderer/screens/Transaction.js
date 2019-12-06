import connect from "../../../../renderer/screens/helpers/connect";

import React, { Component } from "react";
import { hashHistory } from "react-router";

import jsonTheme from "../../../../common/utils/jsonTheme";
import ReactJson from "@seesemichaelj/react-json-view";

class Transaction extends Component {
  componentDidMount(){
    this.refresh();
  }

  refresh() {
    const node = this.props.config.settings.workspace.nodes.find(node => node.safeName === this.props.params.node);
    if (!node) {
      this.setState({results: []});
      return;
    }
    const requests = ["UNCONSUMED", "CONSUMED"].map((status) => {
      return fetch("https://localhost:" + (node.rpcPort + 10000) + "/api/rest/vault/vaultQueryBy", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          "criteria" : {
            "@class" : ".QueryCriteria$VaultQueryCriteria",
            "status" : status,
            // "contractStateTypes" : null,
            "stateRefs" : [{txhash: this.props.params.txhash}],
            // "notary" : null,
            // "softLockingCondition" : null,
            // "timeCondition" : {
            //   "type" : "RECORDED",
            //   "predicate" : {
            //     "@class" : ".ColumnPredicate${'$'}Between",
            //     "rightFromLiteral" : "2019-09-15T12:58:23.283Z",
            //     "rightToLiteral" : "2019-10-15T12:58:23.283Z"
            //   }
            // },
            // "relevancyStatus" : "ALL",
            // "constraintTypes" : [ ],
            // "constraints" : [ ],
            // "participants" : null
          },
          // "paging" : {
          //   "pageNumber" : -1,
          //   "pageSize" : 200
          // },
          // "sorting" : {
          //   "columns" : [ ]
          // },
          // "contractStateType" : "net.corda.core.contracts.ContractState"
        })
      })
      .then(res => res.json());
    });
    return Promise.all(requests).then(results => {
      this.setState({results})
    });
  }
  constructor(props) {
    super(props);

    this.state = {results:[]};
  }

  render() {
    if (this.state.results.length === 0) {
      return (<div>Loading...</div>);
    } else if (!this.state.results[0].states || this.state.results[0].states.length === 0) {
      return (<div>Couldn&apos;t locate transaction {this.props.params.txhash}</div>);
    }
    const tx = this.state.results[0].states[0];
    const unconsumedTx = this.state.results.length > 1 && this.state.results[1].states.length !== 0 ? this.state.results[1].states[0] : null;
    const meta = this.state.results[0].statesMetadata[0];

    // TODO: linearId deletion might be temporary
    // I'm only removing it right now because it can contain a `null` which react-json-view can't handle (crashes)
    // We need to fix this here once https://www.npmjs.com/package/@seesemichaelj/react-json-view is fixed.
    const participants = tx.state.data.participants || [];
    const ignoreFields = ["@class", "participants", "linearId"];
    ignoreFields.forEach(field => {
      delete tx.state.data[field];
    });
    // const keys = Object.keys(tx.state.data).filter(key => !ignoreFields.includes(key));
    return (
      <div className="Nodes DataRows">
        <main>
          <div>
            <button className="Button" onClick={hashHistory.goBack}>
              &larr; Back
            </button>
            <div>
              TX {tx.ref.txhash}
            </div>
            <div>
              {meta.status}
            </div>
          </div>
          <div>
            <div>Contract</div>
            <div>{tx.state.contract}</div>
          </div>
          <div>Consumed</div>
          <ReactJson
            src={
              tx.state.data
            }
            name={false}
            theme={jsonTheme}
            iconStyle="triangle"
            edit={false}
            add={false}
            delete={false}
            enableClipboard={false}
            displayDataTypes={true}
            displayObjectSize={true}
            indentWidth={4}// indent by 4 because that's what Corda likes to do.
            collapsed={1}
            collapseStringsAfterLength={20}
          />
          <div>Unconsumed</div>
          <ReactJson
            src={
              unconsumedTx ? unconsumedTx.state.data : {}
            }
            name={false}
            theme={jsonTheme}
            iconStyle="triangle"
            edit={false}
            add={false}
            delete={false}
            enableClipboard={false}
            displayDataTypes={true}
            displayObjectSize={true}
            indentWidth={4}// indent by 4 because that's what Corda likes to do.
            collapsed={1}
            collapseStringsAfterLength={20}
          />
          {/* <div>
            <table>
              <thead>
                <tr><td colSpan={keys.length}>Input State</td></tr>
                <tr>{keys.map(key => {
                  return (<th key={"input-key"+key}>{key}</th>);
                })}</tr>
              </thead>
              <tbody>
                <tr>{keys.map(key => {
                  return (<td key={"input-value_"+key}>{
                    typeof tx.state.data[key] === "object" ? JSON.stringify(tx.state.data[key]) :tx.state.data[key]
                    }</td>);
                })}</tr>
              </tbody>
              <thead>
                <tr><td colSpan={keys.length}>Output state</td></tr>
                <tr>{keys.map(key => {
                  return (<th key={"output-key"+key}>{key}</th>);
                })}</tr>
              </thead>
              <tbody>
                <tr>
                  {keys.map(key => {
                    return (<td key={"output-value_"+key}>...</td>);
                  })}
                </tr>
              </tbody>

            </table>
          </div> */}
          <div>
            <div>Signers</div>
            <div>...</div>
          </div>
          <div>
            <div>Notary</div>
            <div>{tx.state.notary.name}</div>
          </div>
          <div>
            <div>Timestamp</div>
            <div>{meta.recordedTime}</div>
          </div>
          <div>
            <div>Participants</div>
            <div>{participants.map(node => (
              <div key={"participant_" + node.name}>{node.name}</div>
            ))}</div>
          </div>
        </main>
      </div>
    );
  }
}

export default connect(
  Transaction,
  "config"
);