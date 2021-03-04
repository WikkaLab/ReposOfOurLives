import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import * as az from "azure-devops-node-api";
import * as taskLib from "azure-pipelines-task-lib";
import { CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";

import tl = require("azure-pipelines-task-lib");

export interface IReposTabState {
    userName?: string;
    projectName?: string;
    organization?: SDK.IHostContext;
    repos?: any[];
    error?: null;
    iframeUrl?: string;
}

export class ReposTab extends React.Component<{}, IReposTabState> {

    constructor(props: {}) {
        super(props);

        this.state = {
            iframeUrl: window.location.href
        };
    }

    public componentDidMount() {
        this.initializeState();
    }

    private async initializeState(): Promise<void> {
        await SDK.ready();

        const orgName = SDK.getHost().name;
        const userName = SDK.getUser().displayName;
        this.setState({
            userName,
            organization: SDK.getHost()
        });

        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const project = await projectService.getProject();
        var projectName = "";
        if (project) {
            this.setState({ projectName: project.name });
            projectName = project.name;
        }

        var token = tl.getInput("azureDevOpsToken", true);
        if (token === null) {
            token = tl.getVariable("SYSTEM_ACCESSTOKEN");
        }
        var encoded = btoa(token!);

        var url = "https://dev.azure.com/" + { orgName } + "/" + { projectName } + "/_apis/git/repositories?api-version=6.1-preview.1";
        const headers = { "Authorization": "Basic " + encoded };
        fetch(url, { headers })
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        repos: result.value
                    });
                },
                (error) => {
                    this.setState({
                        error
                    });
                }
            )
    }

    private static getToken() {
        return tl.getInput("azureDevOpsToken", true);
    }

    public render(): JSX.Element {

        const { userName, projectName, repos } = this.state;

        return (
            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                <p>Hello, {userName}, welcome to {projectName}!</p>
                {
                    repos &&
                    <div>Number of repos: {repos.length}</div>
                }
            </div>
        );
    }
}