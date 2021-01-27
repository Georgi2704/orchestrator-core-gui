/*
 * Copyright 2019-2020 SURF.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import {
    addressById,
    internalPortByImsPortId,
    portByImsPortId,
    portByImsServiceId,
    prefixById,
    serviceByImsServiceId,
    subscriptionsDetailWithModel,
} from "api";
import I18n from "i18n-js";
import { isEmpty } from "lodash";
import React, { useContext, useEffect, useState } from "react";
import ApplicationContext from "utils/ApplicationContext";
import { enrichSubscription, ipamStates, organisationNameByUuid } from "utils/Lookups";
import { IMSEndpoint, IMSService, SubscriptionModel, prop } from "utils/types";
import { applyIdNamingConvention } from "utils/Utils";

import SubscriptionDetails from "./SubscriptionDetails";

interface IPAMAddress {
    id: number;
    state: number;
    address: string;
    fqdn: string;
    tags: string[];
}
interface IPAMPrefix {
    id: number;
    description: string;
    afi: number;
    asn: number;
    prefix: string;
    addresses: IPAMAddress[];
    tags: string[];
}

function DataTable({ children }: React.PropsWithChildren<{}>) {
    return (
        <table className="detail-block related-subscription">
            <thead />
            <tbody>{children}</tbody>
        </table>
    );
}

function DataRow({
    type,
    label,
    value,
    rawLabel,
}: {
    type: string;
    label: string;
    value: React.ReactNode;
    rawLabel?: React.ReactNode;
}) {
    return (
        <tr>
            <td className={`${applyIdNamingConvention(`${type}-${label}`)}-k`}>
                {rawLabel ?? I18n.t(`subscription.${type}.${label}`)}
            </td>
            <td className={`${applyIdNamingConvention(`${type}-${label}`)}-v`}>{value}</td>
        </tr>
    );
}

function SubscriptionInstanceValueRow({
    label,
    value,
    isDeleted,
    isExternalLinkValue,
    toggleCollapsed,
    type,
    children,
}: React.PropsWithChildren<{
    label: string;
    value: string;
    isDeleted: boolean;
    isExternalLinkValue: boolean;
    toggleCollapsed: () => void;
    type: string;
}>) {
    const isSubscriptionValue = label.endsWith("subscription_id");
    const icon = children ? "minus" : "plus";

    return (
        <tbody>
            <tr>
                <td>{label.toUpperCase()}</td>
                <td colSpan={isDeleted ? 1 : 2}>
                    <div className="resource-type">
                        {isExternalLinkValue && !isDeleted && (
                            <i className={`fa fa-${icon}-circle`} onClick={toggleCollapsed} />
                        )}
                        {isSubscriptionValue && (
                            <a target="_blank" rel="noopener noreferrer" href={`/subscriptions/${value}`}>
                                {value}
                            </a>
                        )}
                        {!isSubscriptionValue && <span>{value.toString()}</span>}
                    </div>
                </td>
                {isDeleted && (
                    <td>
                        <em className="error">{I18n.t(`subscription.${type}.removed`)}</em>
                    </td>
                )}
            </tr>
            {children && isExternalLinkValue && !isDeleted && (
                <tr className="related-subscription">
                    <td className="whitespace" />
                    <td className="related-subscription-values" colSpan={2}>
                        {children}
                    </td>
                </tr>
            )}
        </tbody>
    );
}

function EndpointDetail({ endpoint }: { endpoint: IMSEndpoint }) {
    if (endpoint.endpointType === "service") {
        return <ImsServiceDetail service={(endpoint as unknown) as IMSService} />;
    }

    const keys =
        endpoint.endpointType === "port"
            ? [
                  "connector_type",
                  "fiber_type",
                  "iface_type",
                  "line_name",
                  "location",
                  "node",
                  "patchposition",
                  "port",
                  "status",
              ]
            : endpoint.endpointType === "internal_port"
            ? ["line_name", "location", "node", "port"]
            : ["name", "product", "speed", "status"];
    const i18n_base = ["port", "internal_port"].includes(endpoint.endpointType) ? "ims_port" : "ims_service";

    return (
        <DataTable>
            {keys.map((attr) => (
                <DataRow key={attr} type={i18n_base} label={attr} value={prop(endpoint, attr as keyof IMSEndpoint)} />
            ))}
        </DataTable>
    );
}

function ImsServiceDetail({ service, recursive = false }: { service: IMSService; recursive?: boolean }) {
    const { organisations } = useContext(ApplicationContext);
    const [endpoints, setEndpoints] = useState<IMSEndpoint[]>([]);

    useEffect(() => {
        if (isEmpty(service) || !recursive) {
            return;
        }

        const uniquePortPromises = (service.endpoints || []).map(async (endpoint) => {
            if (endpoint.type === "port") {
                return portByImsPortId(endpoint.id).then((result) =>
                    Object.assign(result, {
                        serviceId: endpoint.id,
                        endpointType: endpoint.type,
                    })
                );
            } else if (endpoint.type === "internal_port") {
                return internalPortByImsPortId(endpoint.id).then((result) =>
                    Object.assign(result, {
                        serviceId: endpoint.id,
                        endpointType: endpoint.type,
                    })
                );
            } else {
                return serviceByImsServiceId(endpoint.id).then((result) => {
                    if (["SP", "MSP", "SSP"].includes(result.product)) {
                        // In case of port product we just resolve the underlying port
                        return portByImsServiceId(endpoint.id).then((result) =>
                            Object.assign(result, {
                                serviceId: endpoint.id,
                                endpointType: "port",
                            })
                        );
                    }
                    // Return all services that are not actually port services
                    return (Object.assign(result, {
                        serviceId: endpoint.id,
                        endpointType: endpoint.type,
                    }) as unknown) as IMSEndpoint;
                });
            }
        });
        //@ts-ignore
        Promise.all(uniquePortPromises).then((result) => setEndpoints(result.flat()));
    }, [recursive, service]);

    return (
        <DataTable>
            <DataRow type="ims_service" label="identifier" value={service.id} />
            <DataRow
                type="ims_service"
                label="customer"
                value={organisationNameByUuid(service.customer_id, organisations)}
            />
            <DataRow type="ims_service" label="extra_info" value={service.extra_info || ""} />
            <DataRow type="ims_service" label="name" value={service.name || ""} />
            <DataRow type="ims_service" label="product" value={service.product || ""} />
            <DataRow type="ims_service" label="speed" value={service.speed || ""} />
            <DataRow type="ims_service" label="status" value={service.status || ""} />
            <DataRow type="ims_service" label="order_id" value={service.order_id || ""} />
            <DataRow type="ims_service" label="aliases" value={(service.aliases || []).join(", ")} />
            <DataRow type="ims_service" label="order_id" value={service.order_id || ""} />
            <DataRow
                type="ims_service"
                label="endpoints"
                value={(service.endpoints || [])
                    .map(
                        (endpoint) =>
                            `ID: ${endpoint.id}${endpoint.vlanranges ? " - " : ""}${(endpoint.vlanranges || [])
                                .map((vlan) => `VLAN: ${vlan.start} - ${vlan.end}`)
                                .join(", ")}`
                    )
                    .join(", ")}
            />
            {endpoints
                .filter((port) => service.endpoints.map((endpoint) => endpoint.id).includes(port.serviceId))
                .map((port, index) => {
                    const type = ["port", "internal_port"].includes(port.endpointType) ? "ims_port" : "ims_service";
                    return (
                        <DataRow
                            key={index}
                            type={type}
                            label="id"
                            rawLabel={I18n.t(`subscription.${type}.id`, { id: port.id })}
                            value={<EndpointDetail endpoint={port} />}
                        />
                    );
                })}
        </DataTable>
    );
}

function IpamAddress({ address }: { address: IPAMAddress }) {
    return (
        <DataTable>
            <DataRow type="ipam_address" label="id" value={address.id} />
            <DataRow type="ipam_address" label="state" value={ipamStates[address.state]} />
            <DataRow type="ipam_address" label="address" value={address.address} />
            <DataRow type="ipam_address" label="fqdn" value={address.fqdn} />
            <DataRow type="ipam_address" label="tags" value={address.tags.join(", ")} />
        </DataTable>
    );
}

function IpamPrefix({ prefix }: { prefix: IPAMPrefix }) {
    return (
        <DataTable>
            <DataRow type="ipam_prefix" label="description" value={prefix.description} />
            <DataRow type="ipam_prefix" label="prefix" value={prefix.prefix} />
            <DataRow type="ipam_prefix" label="afi" value={prefix.afi} />
            <DataRow type="ipam_prefix" label="asn" value={prefix.asn} />
            <DataRow type="ipam_prefix" label="state" value={ipamStates[prefix.asn]} />
            <DataRow type="ipam_prefix" label="tags" value={prefix.tags.join(", ")} />
            {prefix.addresses &&
                prefix.addresses.map((address, idx) => (
                    <DataRow
                        key={idx}
                        type="ipam_prefix"
                        label="address"
                        rawLabel={I18n.t("subscription.ipam_prefix.address", { id: address.id })}
                        value={<IpamAddress address={address} />}
                    />
                ))}
        </DataTable>
    );
}

export function getExternalTypeData(
    type: string
): { getter: (identifier: string) => Promise<any>; render?: (data: any) => React.ReactNode; i18nKey: string } {
    switch (type) {
        case "ims_port_id":
        case "ims_port_id_1":
        case "ims_port_id_2":
            return {
                getter: (identifier: string) => portByImsPortId(parseInt(identifier)),
                render: (data: IMSEndpoint) => {
                    data.endpointType = "port";
                    return <EndpointDetail endpoint={data} />;
                },
                i18nKey: "ims_port",
            };
        case "ims_circuit_id":
        case "ims_corelink_trunk_id":
            return {
                getter: (identifier: string) => serviceByImsServiceId(parseInt(identifier)),
                render: (data: IMSService) => <ImsServiceDetail service={data} recursive={true} />,
                i18nKey: "ims_service",
            };
        case "node_subscription_id":
        case "port_subscription_id":
        case "ip_prefix_subscription_id":
        case "internetpinnen_prefix_subscription_id":
        case "parent_ip_prefix_subscription_id":
            return {
                getter: (identifier: string) => subscriptionsDetailWithModel(identifier),
                render: (data: SubscriptionModel) => (
                    <SubscriptionDetails subscription={data} className="related-subscription" />
                ),
                i18nKey: "subscription",
            };
        case "ipv4_ipam_id":
        case "ipv6_ipam_id":
        case "ptp_ipv4_ipam_id":
        case "ptp_ipv6_ipam_id":
        case "ipam_prefix_id":
        case "customer_ptp_ipv4_ipam_id":
        case "customer_ptp_ipv6_ipam_id":
            return {
                getter: (identifier: string) => prefixById(parseInt(identifier)),
                render: (data: IPAMPrefix) => <IpamPrefix prefix={data} />,
                i18nKey: "ipam_prefix",
            };
        case "node_ipv4_ipam_id":
        case "node_ipv6_ipam_id":
        case "corelink_ipv4_ipam_id":
        case "corelink_ipv6_ipam_id":
            return {
                getter: (identifier: string) => addressById(parseInt(identifier)),
                render: (data: IPAMAddress) => <IpamAddress address={data} />,
                i18nKey: "ipam_address",
            };
        case "ims_aggregate_port_id":
            return {
                getter: (identifier: string) => internalPortByImsPortId(parseInt(identifier)),
                render: (data: IMSEndpoint) => {
                    data.endpointType = "internal_port";
                    return <EndpointDetail endpoint={data} />;
                },
                i18nKey: "ims_port",
            };
        default:
            return {
                getter: (_: string) => Promise.resolve({}),
                render: undefined,
                i18nKey: "",
            };
    }
}

interface IProps {
    label: string;
    value: string;
}

export default function SubscriptionInstanceValue({ label, value }: IProps) {
    const [collapsed, setCollapsed] = useState(true);
    const [data, setData] = useState<any | null | undefined>(undefined);

    const { render, i18nKey, getter } = getExternalTypeData(label);

    const { organisations, products } = useContext(ApplicationContext);

    const isSubscriptionValue = label.endsWith("subscription_id");
    const isExternalLinkValue = !!render;
    const isDeleted = isExternalLinkValue && data === null;

    useEffect(() => {
        if (data === undefined && !collapsed && isExternalLinkValue) {
            getter(value)
                .catch((err) => Promise.resolve(null))
                .then((data) => {
                    if (data && isSubscriptionValue) {
                        data.product_id = data.product.product_id;
                        enrichSubscription(data as SubscriptionModel, organisations, products);
                    }
                    setData(data);
                });
        }
    }, [data, collapsed, isSubscriptionValue, isExternalLinkValue, getter, value, organisations, products]);

    return (
        <SubscriptionInstanceValueRow
            label={label}
            value={value}
            isDeleted={isDeleted}
            isExternalLinkValue={isExternalLinkValue}
            toggleCollapsed={() => setCollapsed(!collapsed)}
            type={i18nKey}
        >
            {!!data && !collapsed && !!render && render(data)}
        </SubscriptionInstanceValueRow>
    );
}
