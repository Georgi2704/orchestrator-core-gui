import React from "react";
import I18n from "i18n-js";
import PropTypes from "prop-types";

import ConfirmationDialog from "./ConfirmationDialog";

import {isEmpty, stop} from "../utils/Utils";
import {getParameterByName} from "../utils/QueryParameters";
import "./ResourceType.css";
import {resourceType, resourceTypes, saveResourceType} from "../api/index";
import {setFlash} from "../utils/Flash";
import "react-datepicker/dist/react-datepicker.css";
import {formInput} from "../forms/Builder";


export default class ResourceType extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            confirmationDialogOpen: false,
            confirmationDialogAction: () => this.setState({confirmationDialogOpen: false}),
            cancelDialogAction: () => this.props.history.push("/metadata/resource_types"),
            leavePage: true,
            errors: {},
            isNew: true,
            readOnly: false,
            resourceType: {},
            processing: false,
            resourceTypes: []
        };
    }

    componentDidMount() {
        const id = this.props.match.params.id;
        if (id !== "new") {
            const readOnly = getParameterByName("readOnly", window.location.search) === "true";
            resourceType(id).then(res => this.setState({resourceType: res, isNew: false, readOnly: readOnly}));
        }
        resourceTypes().then(res => this.setState({resourceTypes: res}));
    }

    cancel = e => {
        stop(e);
        this.setState({confirmationDialogOpen: true});
    };

    submit = e => {
        stop(e);
        const {resourceType, processing} = this.state;
        const invalid = this.isInvalid() || processing;
        if (!invalid) {
            this.setState({processing: true});
            saveResourceType(resourceType).then(() => {
                this.props.history.push("/metadata/resource_types");
                setFlash(I18n.t(resourceType.resource_type_id ? "metadata.flash.updated" : "metadata.flash.created",
                    {type: "Resource Type", name: resourceType.resource_type}));
            });

        }
    };

    renderButtons = (readOnly) => {
        if (readOnly) {
            return (<section className="buttons">
                <a className="button" onClick={() => this.props.history.push("/metadata/resource_types")}>
                    {I18n.t("metadata.resourceTypes.back")}
                </a>
            </section>);
        }
        const invalid = this.isInvalid() || this.state.processing;
        return (<section className="buttons">
            <a className="button" onClick={this.cancel}>
                {I18n.t("process.cancel")}
            </a>
            <a tabIndex={0} className={`button ${invalid ? "grey disabled" : "blue"}`} onClick={this.submit}>
                {I18n.t("process.submit")}
            </a>
        </section>);
    };

    isInvalid = () => Object.keys(this.state.errors).some(key => this.state.errors[key]);

    validateProperty = name => e => {
        const value = e.target.value;
        const errors = {...this.state.errors};
        if (name === "resource_type") {
            errors[name] = this.state.resourceTypes.some(rt => rt.resource_type === value)
        }
        errors[name] = isEmpty(value);
        this.setState({errors: errors});
    };

    changeProperty = name => e => {
        const {resourceType} = this.state;
        resourceType[name] = e.target ? e.target.value : e.value;
        this.setState({resourceType: resourceType});
    };

    render() {
        const {
            confirmationDialogOpen, confirmationDialogAction, cancelDialogAction, resourceType,
            leavePage, readOnly
        } = this.state;
        return (
            <div className="mod-resource-type">
                <ConfirmationDialog isOpen={confirmationDialogOpen}
                                    cancel={cancelDialogAction}
                                    confirm={confirmationDialogAction}
                                    leavePage={leavePage}/>
                <section className="card">
                    {formInput("metadata.resourceTypes.resource_type", "resource_type", resourceType.resource_type || "",
                        readOnly, this.state.errors, this.changeProperty("resource_type"), this.validateProperty("resource_type"))}
                    {formInput("metadata.resourceTypes.description", "description", resourceType.description || "",
                        readOnly, this.state.errors, this.changeProperty("description"), this.validateProperty("description"))}
                    {this.renderButtons(readOnly)}
                </section>
            </div>
        );
    }
}

ResourceType.propTypes = {
    history: PropTypes.object.isRequired
};
