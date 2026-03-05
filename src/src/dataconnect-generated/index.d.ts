import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface ListAllProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllProjectsData, undefined>;
  operationName: string;
}
export const listAllProjectsRef: ListAllProjectsRef;

export function listAllProjects(): QueryPromise<ListAllProjectsData, undefined>;
export function listAllProjects(dc: DataConnect): QueryPromise<ListAllProjectsData, undefined>;

interface GetMyTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyTasksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyTasksData, undefined>;
  operationName: string;
}
export const getMyTasksRef: GetMyTasksRef;

export function getMyTasks(): QueryPromise<GetMyTasksData, undefined>;
export function getMyTasks(dc: DataConnect): QueryPromise<GetMyTasksData, undefined>;

interface CreateNewTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewTaskVariables): MutationRef<CreateNewTaskData, CreateNewTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewTaskVariables): MutationRef<CreateNewTaskData, CreateNewTaskVariables>;
  operationName: string;
}
export const createNewTaskRef: CreateNewTaskRef;

export function createNewTask(vars: CreateNewTaskVariables): MutationPromise<CreateNewTaskData, CreateNewTaskVariables>;
export function createNewTask(dc: DataConnect, vars: CreateNewTaskVariables): MutationPromise<CreateNewTaskData, CreateNewTaskVariables>;

interface GetProjectDetailsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProjectDetailsVariables): QueryRef<GetProjectDetailsData, GetProjectDetailsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProjectDetailsVariables): QueryRef<GetProjectDetailsData, GetProjectDetailsVariables>;
  operationName: string;
}
export const getProjectDetailsRef: GetProjectDetailsRef;

export function getProjectDetails(vars: GetProjectDetailsVariables): QueryPromise<GetProjectDetailsData, GetProjectDetailsVariables>;
export function getProjectDetails(dc: DataConnect, vars: GetProjectDetailsVariables): QueryPromise<GetProjectDetailsData, GetProjectDetailsVariables>;

