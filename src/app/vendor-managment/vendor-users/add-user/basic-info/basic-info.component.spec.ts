import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BasicInfoComponent } from 'src/app/shared/components/svms-tab-components/basic-info/basic-info.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
describe('BasicInfoComponent', () => {
  let component: BasicInfoComponent;
  let fixture: ComponentFixture<BasicInfoComponent>;
  CommonTestingModule.setUpTestBed(BasicInfoComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
