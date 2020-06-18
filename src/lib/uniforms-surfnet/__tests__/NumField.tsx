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
import React from "react";

import { NumField } from "../src";
import createContext from "./_createContext";
import mount from "./_mount";

test("<NumField> - renders an input", () => {
    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
});

test("<NumField> - renders an input with correct disabled state", () => {
    const element = <NumField name="x" disabled />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("disabled")).toBe(true);
});

test("<NumField> - renders an input with correct id (inherited)", () => {
    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("id")).toBeTruthy();
});

test("<NumField> - renders an input with correct id (specified)", () => {
    const element = <NumField name="x" id="y" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("id")).toBe("y");
});

test("<NumField> - renders an input with correct max", () => {
    const element = <NumField name="x" max={10} />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.childAt(0).prop("max")).toBe(10);
});

test("<NumField> - renders an input with correct min", () => {
    const element = <NumField name="x" min={10} />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.childAt(0).prop("min")).toBe(10);
});

test("<NumField> - renders an input with correct name", () => {
    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("name")).toBe("x");
});

test("<NumField> - renders an input with correct placeholder", () => {
    const element = <NumField name="x" placeholder="y" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("placeholder")).toBe("y");
});

test("<NumField> - renders an input with correct type", () => {
    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("type")).toBe("text");
});

test("<NumField> - renders an input with correct value (default)", () => {
    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("value")).toBe("");
});

test("<NumField> - renders an input with correct value (model)", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" precision={2} />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { model: { x: 1.01 }, onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("value")).toBe("1.01");

    // NOTE: All following tests are here to cover hacky NumField implementation.
    const spy = jest.spyOn(global.console, "error").mockImplementation(() => {});

    [
        { value: 0.1 },
        { value: 0 },
        { value: 0 },
        { value: 2 },
        { value: 2 },
        { value: 1, precision: 0 },
        { value: 1, precision: 0 }
    ].forEach(({ precision = 2, value }) => {
        wrapper.setProps({ precision });

        expect(wrapper.find("input").simulate("change", { target: { value: "" } })).toBeTruthy();
        expect(wrapper.find("input").simulate("change", { target: { value } })).toBeTruthy();
        expect(onChange).toHaveBeenLastCalledWith("x", value);

        wrapper.setProps({ value: undefined });
        wrapper.setProps({ value });
    });

    spy.mockRestore();
});

test("<NumField> - renders an input with correct value (specified)", () => {
    const element = <NumField name="x" value={2} />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").prop("value")).toBe("2");
});

test("<NumField> - renders an input which correctly reacts on change", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").simulate("change", { target: { value: "1" } })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith("x", 1);
});

test("<NumField> - renders an input which correctly reacts on change (decimal on decimal)", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" precision={1} />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").simulate("change", { target: { value: "2.5" } })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith("x", 2.5);
});

test("<NumField> - renders an input which correctly reacts on change (decimal on integer)", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" precision={0} step={0} />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").simulate("change", { target: { value: "2.5" } })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith("x", 2.5);
});

test("<NumField> - renders an input which correctly reacts on change (empty)", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").simulate("change", { target: { value: "" } })).toBeTruthy();
    expect(onChange).toBeCalledTimes(0);
});

test("<NumField> - renders an input which correctly reacts on change (same value)", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { model: { x: 1 }, onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").simulate("change", { target: { value: "1" } })).toBeTruthy();
    expect(onChange).toBeCalledTimes(0);
});

test("<NumField> - renders an input which correctly reacts on change (zero)", () => {
    const onChange = jest.fn();

    const element = <NumField name="x" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }, { onChange }));

    expect(wrapper.find("input")).toHaveLength(1);
    expect(wrapper.find("input").simulate("change", { target: { value: "0" } })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith("x", 0);
});

test("<NumField> - renders a label", () => {
    const element = <NumField name="x" label="y" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(wrapper.find("label")).toHaveLength(1);
    expect(wrapper.find("label").text()).toBe("y");
    expect(wrapper.find("label").prop("htmlFor")).toBe(wrapper.find("input").prop("id"));
});

test("<NumField> - renders a wrapper with unknown props", () => {
    const element = <NumField name="x" data-x="x" data-y="y" data-z="z" />;
    const wrapper = mount(element, createContext({ x: { type: Number } }));

    expect(
        wrapper
            .find("div")
            .at(0)
            .prop("data-x")
    ).toBe("x");
    expect(
        wrapper
            .find("div")
            .at(0)
            .prop("data-y")
    ).toBe("y");
    expect(
        wrapper
            .find("div")
            .at(0)
            .prop("data-z")
    ).toBe("z");
});
