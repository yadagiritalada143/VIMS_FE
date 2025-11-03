import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickViewFlowComponent } from './quick-view-flow.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
describe('QuickViewFlowComponent', () => {
  let component: QuickViewFlowComponent;
  let fixture: ComponentFixture<QuickViewFlowComponent>;
  CommonTestingModule.setUpTestBed(QuickViewFlowComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuickViewFlowComponent ]
    })
    .compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(QuickViewFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
