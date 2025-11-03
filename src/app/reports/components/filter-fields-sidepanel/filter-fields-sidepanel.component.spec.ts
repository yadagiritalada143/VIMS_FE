import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { FilterFieldsSidepanelComponent } from './filter-fields-sidepanel.component';
import { ActiveColumnOrderPipe } from '../../pipes/active-column-order.pipe';
import { ActiveColumnFilterPipe } from '../../pipes/active-column-filter.pipe';
describe('FilterFieldsSidepanelComponent', () => {
  let component: FilterFieldsSidepanelComponent;
  let fixture: ComponentFixture<FilterFieldsSidepanelComponent>;
  CommonTestingModule.setUpTestBed(FilterFieldsSidepanelComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterFieldsSidepanelComponent, ActiveColumnOrderPipe, ActiveColumnFilterPipe ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterFieldsSidepanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
