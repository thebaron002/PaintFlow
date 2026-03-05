import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface CreateNewTaskData {
  task_insert: Task_Key;
}

export interface CreateNewTaskVariables {
  name: string;
  description?: string | null;
  projectId?: UUIDString | null;
  startDate?: DateString | null;
  endDate?: DateString | null;
}

export interface GetMyTasksData {
  tasks: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    status: string;
    startDate?: DateString | null;
    endDate?: DateString | null;
    project?: {
      id: UUIDString;
      name: string;
    } & Project_Key;
  } & Task_Key)[];
}

export interface GetProjectDetailsData {
  project?: {
    id: UUIDString;
    name: string;
    description?: string | null;
    status?: string | null;
    createdAt: TimestampString;
    dueDate?: DateString | null;
    owner?: {
      id: UUIDString;
      displayName: string;
    } & User_Key;
      tasks_on_project: ({
        id: UUIDString;
        name: string;
        status: string;
        startDate?: DateString | null;
      } & Task_Key)[];
        projectMembers_on_project: ({
          role: string;
          user: {
            id: UUIDString;
            displayName: string;
          } & User_Key;
        })[];
  } & Project_Key;
}

export interface GetProjectDetailsVariables {
  projectId: UUIDString;
}

export interface ListAllProjectsData {
  projects: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    status?: string | null;
    dueDate?: DateString | null;
    owner?: {
      displayName: string;
    };
  } & Project_Key)[];
}

export interface ProjectMember_Key {
  projectId: UUIDString;
  userId: UUIDString;
  __typename?: 'ProjectMember_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface TaskAssignment_Key {
  taskId: UUIDString;
  userId: UUIDString;
  __typename?: 'TaskAssignment_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'ListAllProjects' Query. Allow users to execute without passing in DataConnect. */
export function listAllProjects(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllProjectsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAllProjects' Query. Allow users to pass in custom DataConnect instances. */
export function listAllProjects(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllProjectsData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyTasks' Query. Allow users to execute without passing in DataConnect. */
export function getMyTasks(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyTasksData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyTasks' Query. Allow users to pass in custom DataConnect instances. */
export function getMyTasks(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyTasksData>>;

/** Generated Node Admin SDK operation action function for the 'CreateNewTask' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewTask(dc: DataConnect, vars: CreateNewTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewTaskData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewTask' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewTask(vars: CreateNewTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewTaskData>>;

/** Generated Node Admin SDK operation action function for the 'GetProjectDetails' Query. Allow users to execute without passing in DataConnect. */
export function getProjectDetails(dc: DataConnect, vars: GetProjectDetailsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetProjectDetailsData>>;
/** Generated Node Admin SDK operation action function for the 'GetProjectDetails' Query. Allow users to pass in custom DataConnect instances. */
export function getProjectDetails(vars: GetProjectDetailsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetProjectDetailsData>>;

