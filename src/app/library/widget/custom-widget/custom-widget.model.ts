import { widgetIcons } from '../widget-icons.config'
import { ICustomWidget } from '../widget.interfaces'
import { WidgetCategories, Widgets, WidgetSizes } from '../widget.types'

const сustomCardMyProfileConfig: ICustomWidget = {
  label: 'My Profile',
  category: WidgetCategories.Custom,
  name: Widgets.CustomCardMyProfile,
  api: '/assignment/programs/<PROGRAM_ID>/assignment/<ASSIGNMENT_ID>',
  link: '/',
  ...widgetIcons[Widgets.CustomCardMyProfile],
  isActive: false,
  isExpandable: true,
  height: 4,
  width: 12,
  minHeight: 4,
  maxHeight: 10,
  minWidth: 5,
  maxWidth: 16,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

export const customWidgetsConfig = {
  [Widgets.CustomCardMyProfile]: сustomCardMyProfileConfig
}