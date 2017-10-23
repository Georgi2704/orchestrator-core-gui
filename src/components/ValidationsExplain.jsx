import React from "react";
import PropTypes from "prop-types";
import "./ValidationsExplain.css";
import Highlight from "react-highlight";
import "highlight.js/styles/default.css";

export default class ValidationsExplain extends React.PureComponent {

    componentWillReceiveProps(nextProps) {
        if (this.props.isVisible === false && nextProps.isVisible === true) {
            setTimeout(() => this.main.focus(), 50);
        }
    }

    explanation = () => <section className="explanation">
        <h3>Explanation</h3>
        <p>The Product Configuration in <span>core-db</span> must match the corresponding workflow implementation for that Product.</p>
        <p>Processes described / implemented in workflows that result in a subscription will populate
            the subscription instance values. These subscription instance values are linked to Resource types which
            are configured in the Resource Blocks of the Product.</p>
    </section>;

    details = () => <section className="details">
        <h3>Details</h3>
        <p>The validations consist of each Product validated against the <span className="code">workflow_subscription_mapping </span>
            of the Workflow. All the Resource Blocks with their subsequent Resource Types configured to be present
            in the workflow linked to the Product (e.g. the column value <span className="code">create_subscription_workflow_key</span>)
            must also be configured in <span>core-db</span>.</p>

        <p>Each mismatch - being a completely missing Resource Block or missing individual Resource Types - is
            reported and results in an invalid Product configuration.</p>
    </section>;

    example = () => <section className="example">
        <h3>Example</h3>
        <p>A workflow with the following <span className="code">workflow_subscription_mapping</span>:</p>
        <Highlight className="JSON">
            {JSON.stringify([{
                "Ethernet Circuit": [
                    {"nms_service_id": "service_id", "servicespeed": "capacity"}
                ]
            }],null, 2)}
        </Highlight>
        <p>Will at a minimal need to populate the state variables <span>service_id</span> and <span>capacity </span>
            during the execution of the various Process steps.</p>
        <p>The corresponding Product configuration of this workflow must at a minimal
            contain the Resource Block <span>Ethernet Circuit</span> with the Resource Types
            <span> nms_service_id</span> and <span>servicespeed</span>
        </p>
    </section>;

    render() {
        const {close, isVisible} = this.props;
        const className = isVisible ? "" : "hide";
        return (
            <div className={`validation-explain ${className}`}
                 tabIndex="1" onBlur={close} ref={ref => this.main = ref}>
                <section className="container">
                    <section className="title">
                        <p>Product / Workflow Validations</p>
                        <a className="close" onClick={close}>
                            <i className="fa fa-remove"></i>
                        </a>
                    </section>
                    {this.explanation()}
                    {this.details()}
                    {this.example()}
                </section>
            </div>
        );
    }
}

ValidationsExplain.propTypes = {
    close: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired
};

