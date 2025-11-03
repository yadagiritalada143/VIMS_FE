let sideBarOptions: Array<any> = [
    {
      name: 'control_panel',
      icon: 'layers',
      submenuItem: [
        {
          icon: 'layers',
          name: 'programs',
          path: '/programs/list',
          permission: 'view_program',
        },
        {
          icon: 'account_tree',
          name: 'users',
          path: '/user-management/list',
          permission: 'menu_users',
        },
        {
          icon: 'area_chart',
          name: 'msp_s',
          path: '/org/list/msp',
          permission: 'menu_programs',
        },
        {
          icon: 'pin_drop',
          name: 'clients',
          path: '/org/list/client',
          permission: 'menu_programs',
        },
        {
          icon: 'device_hub',
          name: 'vendors',
          path: '/org/list/vendor',
          permission: 'menu_programs',
        },
        {
          icon: 'rocket_launch',
          name: 'global_launch_flags',
          path: '/global-launches',
          permission: 'view_program'
        }
      ],
    },
  ];
  
  export default sideBarOptions;
  