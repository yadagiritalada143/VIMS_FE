import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReassignItemsComponent } from './reassign-items.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ReassignItemsComponent', () => {
  let component: ReassignItemsComponent;
  let fixture: ComponentFixture<ReassignItemsComponent>;
  CommonTestingModule.setUpTestBed(ReassignItemsComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReassignItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReassignItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
