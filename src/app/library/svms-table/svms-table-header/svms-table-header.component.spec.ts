import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderByPipe } from '../pipe/order-by.pipe';
import { SvmsTableHeaderComponent } from './svms-table-header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SvmsTableFilterComponent } from '../svms-table-filter/svms-table-filter.component';
import { SvmsColumnSettingComponent } from '../svms-column-setting/svms-column-setting.component';

describe('SvmsTableHeaderComponent', () => {
  let component: SvmsTableHeaderComponent;
  let fixture: ComponentFixture<SvmsTableHeaderComponent>;
  CommonTestingModule.setUpTestBed(SvmsTableHeaderComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsTableHeaderComponent, OrderByPipe ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsTableHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should render app-svms-table-filter component with correct properties',()=>{
    const filterComponent=fixture.nativeElement.querySelector('app-svms-table-filter');
    expect(filterComponent).toBeTruthy();
    expect(filterComponent.visibility).toEqual(component.filterVisible);
    expect(filterComponent.filterConfig).toEqual(component.headerConfig?.advanceFilter ?? []);
  });

  it('should render app-svms-column-setting component with correct properties',()=>{
    const columnSettingComponent=fixture.nativeElement.querySelector('app-svms-column-setting');
    expect(columnSettingComponent).toBeTruthy();
    expect(columnSettingComponent.visibility).toEqual(component.showColoumnSetting);
    // expect(columnSettingComponent?.coloumnSettingConfig).toEqual(component?.headerConfig?.columnSettingConfig);
    expect(columnSettingComponent.selectedColumns).toEqual(component.colDefinition);
  });

  it('',()=>{

  });
});
