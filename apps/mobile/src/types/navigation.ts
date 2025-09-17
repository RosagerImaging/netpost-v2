import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type MainTabParamList = {
  Sourcing: undefined;
  Inventory: undefined;
  Profile: undefined;
};

export type SourcingStackParamList = {
  SourcingList: undefined;
  Camera: undefined;
  ItemForm: { photoUri?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}