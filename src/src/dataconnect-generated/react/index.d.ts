import { ListAllProjectsData, GetMyTasksData, CreateNewTaskData, CreateNewTaskVariables, GetProjectDetailsData, GetProjectDetailsVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAllProjects(options?: useDataConnectQueryOptions<ListAllProjectsData>): UseDataConnectQueryResult<ListAllProjectsData, undefined>;
export function useListAllProjects(dc: DataConnect, options?: useDataConnectQueryOptions<ListAllProjectsData>): UseDataConnectQueryResult<ListAllProjectsData, undefined>;

export function useGetMyTasks(options?: useDataConnectQueryOptions<GetMyTasksData>): UseDataConnectQueryResult<GetMyTasksData, undefined>;
export function useGetMyTasks(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyTasksData>): UseDataConnectQueryResult<GetMyTasksData, undefined>;

export function useCreateNewTask(options?: useDataConnectMutationOptions<CreateNewTaskData, FirebaseError, CreateNewTaskVariables>): UseDataConnectMutationResult<CreateNewTaskData, CreateNewTaskVariables>;
export function useCreateNewTask(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewTaskData, FirebaseError, CreateNewTaskVariables>): UseDataConnectMutationResult<CreateNewTaskData, CreateNewTaskVariables>;

export function useGetProjectDetails(vars: GetProjectDetailsVariables, options?: useDataConnectQueryOptions<GetProjectDetailsData>): UseDataConnectQueryResult<GetProjectDetailsData, GetProjectDetailsVariables>;
export function useGetProjectDetails(dc: DataConnect, vars: GetProjectDetailsVariables, options?: useDataConnectQueryOptions<GetProjectDetailsData>): UseDataConnectQueryResult<GetProjectDetailsData, GetProjectDetailsVariables>;
